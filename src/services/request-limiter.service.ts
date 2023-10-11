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
    OrderData
} from '../models/cakery-api.models';
import config from '../utils/cakery-api.config';
import { MessageForClient } from '../models/models';
import sse from '../utils/sse';
import { Response } from 'express';

const RATE_LIMIT = 60;
const processedRequests: ProcessedRequest[] = [];
const queue: ClientRequestData[] = [];

interface ProcessedRequest {
    clientId: string;
    promise: Promise<CakeryApiResponse>;
}

interface ClientRequestDataBase {
    clientId: string;
    responseObj: Response;
}

interface ClientGetRequestData extends ClientRequestDataBase {
    requestType: 'cakes';
}

interface ClientPostRequestData extends ClientRequestDataBase {
    requestType: 'order';
    cake: string;
}

export type ClientRequestData = ClientGetRequestData | ClientPostRequestData;

type CakeryApiResponse = CakeryApiCakesResponse | CakeryApiOrdersResponse;

const queueRequest = (requestData: ClientRequestData) => {
    queue.push(requestData);
};

const callCakeryApi = (
    requestData: ClientRequestData
): Promise<CakeryApiResponse> => {
    if (requestData.requestType === 'cakes') {
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
            config.cakeryUrl + 'orders',
            {
                ...config.cakeryApiGetRequestData,
                cake: requestData.cake
            },
            {
                headers: config.cakeryApiHeaders
            }
        );
    }
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
                if (requestData.requestType === 'cakes') {
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

            requestData.responseObj.write(sse.toSseData(messageForClient));
        })
        .catch((e) => {
            console.error(e);
            throw new Error(
                JSON.stringify([`${CakeryApiErrors.DEAD}. Please check logs`])
            );
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

const takeRequestFromQueue = () => {
    if (queue.length > 0) {
        const requestData = queue.shift();
        handleRequest(requestData!);
    }
};

const removeProcessedRequest = (clientId: string) => {
    const index = processedRequests.findIndex((r) => r.clientId === clientId);
    if (index >= 0) {
        processedRequests.splice(index, 1);
    }
};

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

export default { handleRequest };
