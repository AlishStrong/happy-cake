/**
 * Special service for limiting the total number of requests per second made by this application to Cakery API.
 * The limit is specified by {@link RATE_LIMIT}
 *
 * Requests to Cakery API are passed to @see handleRequest function.
 * When it is called, the function first checks if @see processedRequests array has space.
 * @see processedRequests array's length can by maximum of @see RATE_LIMIT value.
 * If that is true, the call is made to Cakery API via @see callCakeryApi
 * and call's promise with other metadata as a whole are added to @see processedRequests
 * Else, the request is pushed to @see queue via @see queueRequest function.
 *
 * The call's promise is processed by @see processCakeryApiResponse function.
 * When the promise resolves/rejects, client will receive a message via SSE.
 * The function will also remove the request's data from the @see processedRequests array
 * and take the next available request from the @see queue via @see takeRequestFromQueue
 *
 * The @see takeRequestFromQueue function takes a request element from the end of the @see queue array
 * and removes that element from that array.
 * It then calls @see handleRequest function with the taken request and the process repeats.
 */

import axios from 'axios';
import {
    Cake,
    CakeData,
    CakeOrder,
    CakeryApiCakesResponse,
    CakeryApiErrors,
    CakeryApiOrdersResponse,
    CakeryApiPostRequestBody,
    CakeryApiRequestBody,
    CakeryApiResponse,
    CakeryEndpoint,
    OrderData
} from '../models/cakery-api.models';
import config from '../utils/cakery-api.config';
import { DatabaseErrors, MessageForClient } from '../models/models';
import sse from '../utils/sse';
import {
    ClientRequestData,
    ProcessedRequest
} from '../models/request-limiter.models';
import databaseService from './database.service';
import { unlinkSync } from 'fs';

const RATE_LIMIT = 60;
const processedRequests: ProcessedRequest[] = [];
const queue: ClientRequestData[] = [];

const handleRequest = (requestData: ClientRequestData) => {
    if (processedRequests.length < RATE_LIMIT) {
        // make the request to Cakery API
        const cakeryPromise = callCakeryApi(requestData);

        // put the promise to the list of processed requests
        // for controlling the request rate to Cakery API
        processedRequests.push({
            clientId: requestData.clientId,
            promise: cakeryPromise
        });

        processCakeryApiResponse(cakeryPromise, requestData);
    } else {
        // queue the request
        queueRequest(requestData);
    }
};

const callCakeryApi = (
    requestData: ClientRequestData
): Promise<CakeryApiResponse> => {
    if (requestData.requestType === CakeryEndpoint.CAKES) {
        return axios.get<
            CakeData,
            CakeryApiCakesResponse,
            CakeryApiRequestBody
        >(config.cakeryUrl + requestData.requestType, {
            headers: config.cakeryApiHeaders,
            data: config.cakeryApiGetRequestData
        });
    } else {
        return axios.post<
            OrderData,
            CakeryApiOrdersResponse,
            CakeryApiPostRequestBody
        >(
            config.cakeryUrl + requestData.requestType,
            {
                ...config.cakeryApiGetRequestData,
                cake: requestData.reservationBody.cake
            },
            {
                headers: config.cakeryApiHeaders
            }
        );
    }
};

const queueRequest = (requestData: ClientRequestData) => {
    queue.push(requestData);
};

const processCakeryApiResponse = (
    cakeryPromise: Promise<CakeryApiResponse>,
    requestData: ClientRequestData
) => {
    cakeryPromise
        .then((r) => {
            const messageForClient: MessageForClient = {
                status: 'processing',
                message: 'something weird happened!'
            };
            if (r.status === 200) {
                messageForClient.status = 'success';
                if (requestData.requestType === CakeryEndpoint.CAKES) {
                    const cakes = r.data.data as Cake[];
                    messageForClient.message = JSON.stringify(cakes);
                } else {
                    const data = r.data.data as CakeOrder;
                    messageForClient.message = data.order_id;
                }
            } else if (r.status === 500) {
                messageForClient.status = 'error';
                messageForClient.message = r.data.message!;
            } else if (r.status === 429) {
                messageForClient.status = 'error';
                messageForClient.message = CakeryApiErrors.TOO_MANY;
            } else {
                messageForClient.status = 'error';
                messageForClient.message = `${CakeryApiErrors.DEAD}. It returned ${r.status}`;
            }

            return messageForClient;
        })
        .then((m) => {
            if (
                m.status === 'error' ||
                requestData.requestType === CakeryEndpoint.CAKES
            ) {
                requestData.responseObj.write(sse.toSseData(m));
                return Promise.resolve();
            } else {
                return databaseService
                    .saveReservation(requestData.reservationBody, m.message)
                    .then((_) => {
                        requestData.responseObj.write(sse.toSseData(m));
                    });
            }
        })
        .catch((e: Error) => {
            console.error('processCakeryApiResponse caught error', e);
            const messageForClient: MessageForClient = {
                status: 'error',
                message: `${CakeryApiErrors.DEAD}. Please check logs`
            };
            if (Object.values<string>(DatabaseErrors).includes(e.message)) {
                messageForClient.message = e.message;
            }

            // remove image if there is
            if (
                'reservationBody' in requestData &&
                requestData.reservationBody.image
            ) {
                unlinkSync('./images/' + requestData.reservationBody.image);
            }

            requestData.responseObj.write(sse.toSseData(messageForClient));
        })
        .finally(() => {
            // remove request from processedRequests
            removeProcessedRequest(requestData.clientId);

            // handle next request from the queue
            takeRequestFromQueue();

            // manually shut SSE in case client did not do so
            setTimeout(() => {
                requestData.responseObj.end();
            }, 3000);
        });
};

const removeProcessedRequest = (clientId: string) => {
    const index = processedRequests.findIndex((r) => r.clientId === clientId);
    if (index >= 0) {
        processedRequests.splice(index, 1);
    }
};

const takeRequestFromQueue = () => {
    if (queue.length > 0) {
        const requestData = queue.shift();
        handleRequest(requestData!);
    }
};

export default { handleRequest };
