import { Request, Response } from 'express';
import axios from 'axios';
import config from '../utils/cakery-api.config';
import {
    CakeryApiPostRequestBody,
    CakeryApiOrdersResponse,
    OrderData,
    CakeryApiErrors
} from '../models/cakery-api.models';
import {
    ClientData,
    MessageForClient,
    ReservationBody
} from '../models/models';
import validators from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';
import sse from '../utils/sse';
import requestLimiterService, {
    ClientRequestData
} from '../services/request-limiter.service';

const cakeryApiHeaders = config.cakeryApiHeaders;

const clients: ClientData[] = [];

const removeClient = (clientId: string) => {
    const index = clients.findIndex((c) => c.clientId === clientId);
    if (index !== -1) {
        clients.splice(index, 1);
    }
};

const checkCakeStock = (request: Request, response: Response): void => {
    // Step 1: check that the request has headers "Accept: text/event-stream" needed for SSE
    const acceptHeader = request.header('Accept');
    if (!acceptHeader || acceptHeader !== 'text/event-stream') {
        throw new Error(JSON.stringify(['Missing request headers']));
    }

    // Step 2: generate request client ID
    const clientId = uuidv4();

    // Step 3: add client ID to an array of clients
    const clientData: ClientData = {
        clientId
    };
    clients.push(clientData);

    // Step 4: prepare SSE channel to the client
    response.writeHead(200, sse.headers);

    // Step 5: notify client that the request is processing and it should keep channel open
    const messageForClient: MessageForClient = {
        status: 'processing',
        message: 'keep SSE open'
    };
    response.write(sse.toSseData(messageForClient));

    // Step 6: Register listeners for filtering clients when SSE closes
    request.on('close', () => {
        removeClient(clientId);
    });
    response.on('finish', () => {
        removeClient(clientId);
    });

    // Step 7: get cakes data from Cakery API
    const requestData: ClientRequestData = {
        clientId,
        requestType: 'cakes',
        responseObj: response
    };
    requestLimiterService.handleRequest(requestData);
};

const reserveCake = (request: Request, response: Response): void => {
    // Step 1: check request body
    const reservationBody: ReservationBody = validators.toReservationBody(
        request.body
    );

    // Step 2: generate request client ID
    const clientId = uuidv4();

    // Step 3: add reservation body and client ID to an array of clients
    const clientData: ClientData = {
        clientId,
        reservationBody
    };
    clients.push(clientData);

    // Step 4: respond with redirect to GET /reserve with the generated client ID
    response.redirect(303, '/reserve/' + clientId);
};

const reserveCakeSse = (request: Request, response: Response): void => {
    // Step 5: check that the request has headers "Accept: text/event-stream" needed for SSE
    const acceptHeader = request.header('Accept');
    if (!acceptHeader || acceptHeader !== 'text/event-stream') {
        throw new Error(JSON.stringify(['Missing request headers']));
    }

    // Step 6: check that the client ID is valid
    const clientId = request.params.id;
    const foundClient = clients.find((c) => c.clientId === clientId);
    if (!foundClient) {
        throw new Error(JSON.stringify(['Unknown client request']));
    }

    // Step 7: prepare SSE channel to the client
    response.writeHead(200, sse.headers);

    // Step 8: notify client that the request is processing and it should keep channel open
    const messageForClient: MessageForClient = {
        status: 'processing',
        message: 'keep SSE open'
    };
    response.write(sse.toSseData(messageForClient));

    // Step 9: Register listeners for filtering clients when SSE closes
    request.on('close', () => {
        removeClient(clientId);
    });
    response.on('finish', () => {
        removeClient(clientId);
    });

    // Step 10: make the order reservation request of the client to Cakery API /orders
    axios
        .post<OrderData, CakeryApiOrdersResponse, CakeryApiPostRequestBody>(
            config.cakeryUrl + 'orders',
            {
                ...config.cakeryApiGetRequestData,
                cake: foundClient.reservationBody!.cake
            },
            {
                headers: cakeryApiHeaders
            }
        )
        .then((r) => {
            // Step 11: process the response from Cakery API
            const messageForClient: MessageForClient = {
                status: 'processing',
                message: 'something weird happened!'
            };
            if (r.status === 200) {
                messageForClient.status = 'success';
                messageForClient.message = r.data.data!.order_id;
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

            // Step 12: notify client; client must close SSE once status is 'success' OR 'error'
            response.write(sse.toSseData(messageForClient));
        })
        .catch((e) => {
            console.error(e);
            throw new Error(
                JSON.stringify([`${CakeryApiErrors.DEAD}. Please check logs`])
            );
        })
        .finally(() => {
            // Step 13: remove client from the list
            removeClient(clientId);

            // manually shut SSE in case client did not do so
            setTimeout(() => {
                response.end();
            }, 3000);
        });
};

export default {
    checkCakeStock,
    reserveCakeSse,
    reserveCake
};
