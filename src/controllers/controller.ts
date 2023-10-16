import { Request, Response } from 'express';
import {
    ClientData,
    ClientDataForPost,
    MessageForClient,
    ReservationBody,
    ReservationBodyError
} from '../models/models';
import validators from '../utils/validators';
import { v4 as uuidv4 } from 'uuid';
import sse from '../utils/sse';
import requestLimiterService from '../services/request-limiter.service';
import { ClientRequestData } from '../models/request-limiter.models';
import { CakeryEndpoint } from '../models/cakery-api.models';
import databaseService from '../services/database.service';
import clientsService from '../services/clients.service';
import imageFileService from '../services/image-file.service';

/**
 * Registers listeners on @see Request and @see Response to remove clients
 * once SSE connection with the client is finished
 *
 * @param clientId uuid of a client that made the request
 * @param request {@link Request} object to register 'close' listener
 * @param response {@link Response} object to register 'finish' listener
 */
const registerListeners = (
    clientId: string,
    request: Request,
    response: Response
) => {
    request.on('close', () => {
        clientsService.removeClient(clientId);
    });
    response.on('finish', () => {
        clientsService.removeClient(clientId);
    });
};

/**
 * Handle requests for checking the stock of cakes.
 *
 * @param Request must include 'Accept: text/event-stream' headers.
 *
 * Responses to client with real-time messages @see MessageForClient via SSE.
 * When status of message is 'processing', client must keep the SSE channel open.
 * When status of message is 'success' or 'error', client needs to process the message-field and close the channel.
 *
 * Includes listeners for automatic SSE channel closure in case the client faces problems
 */
const checkCakeStock = (request: Request, response: Response): void => {
    // Step 1: check that the request has headers "Accept: text/event-stream" needed for SSE
    validators.checkAcceptHeaders(request);

    // Step 2: generate request client ID
    const clientId = uuidv4();

    // Step 3: add client ID to an array of clients
    const clientData: ClientData = {
        clientId
    };
    clientsService.clients.push(clientData);

    // Step 4: prepare SSE channel to the client
    response.writeHead(200, sse.headers);

    // Step 5: notify client that the request is processing and it should keep channel open
    const messageForClient: MessageForClient = {
        status: 'processing',
        message: 'keep SSE open'
    };
    response.write(sse.toSseData(messageForClient));

    // Step 6: Register listeners for filtering clients when SSE closes
    registerListeners(clientId, request, response);

    // Step 7: get cakes data from Cakery API
    const requestData: ClientRequestData = {
        clientId,
        requestType: CakeryEndpoint.CAKES,
        responseObj: response
    };
    requestLimiterService.handleRequest(requestData);
};

/**
 * PART 1 of the Cake Reservation process
 * Notify application about an intent to reserve a cake.
 *
 * @param Request body must include @see ReservationBody
 *
 * Responses with a redirect url that contains generated client ID.
 * If client receives a response of status 303,
 * it must make a subsequent GET request to the redirect url.
 * Browser clients can open an SSE channel only via GET requests!
 * After that the process's PART 2 will continue by @see reserveCakeSse
 */
const reserveCake = async (request: Request, response: Response) => {
    // Step 1: check request body
    const reservationBody: ReservationBody = validators.toReservationBody(
        request.body
    );

    // Step 2: generate request client ID
    const clientId = uuidv4();

    // Step 3: check image in the request body
    const imageFile = request.file;
    if (imageFile) {
        const imageName = await imageFileService.processReservationBodyImage(
            imageFile,
            clientId
        );
        reservationBody.image = imageName;
    }

    // Step 4: add reservation body and client ID to an array of clients
    const clientData: ClientDataForPost = {
        clientId,
        reservationBody,
        status: 'initialized'
    };
    clientsService.clients.push(clientData);

    // Step 5: respond with redirect to GET /reserve with the generated client ID
    response.redirect(303, '/reserve/' + clientId);
};

/**
 * PART 2 of the Cake Reservation process; for PART 1 @see reserveCake
 * Make a cake order via Cakery API and notify the client via SSE.
 *
 * @param Request must include 'Accept: text/event-stream' headers.
 * @param Request must include client ID path parameter.
 *
 * Responses to client with real-time messages @see MessageForClient via SSE.
 * Messages are stringified JSONs and need to be parsed by the client.
 * When status of message is 'processing', client must keep the SSE channel open.
 * When status of message is 'success' or 'error', client needs to process the message-field and close the channel.
 *
 * Includes listeners for automatic SSE channel closure in case the client faces problems
 */
const reserveCakeSse = (request: Request, response: Response): void => {
    // Step 6: check that the request has headers "Accept: text/event-stream" needed for SSE
    validators.checkAcceptHeaders(request);

    // Step 7: check that the client ID is valid
    const clientId = request.params.id;
    const foundClient = clientsService.getClient(clientId) as ClientDataForPost;

    // Step 8: prepare SSE channel to the client
    response.writeHead(200, sse.headers);

    // Step 9: notify client that the request is processing and it should keep channel open
    const messageForClient: MessageForClient = {
        status: 'processing',
        message: 'keep SSE open'
    };
    response.write(sse.toSseData(messageForClient));

    // Step 10: Register listeners for filtering clients when SSE closes
    registerListeners(clientId, request, response);

    // Step 11: order a cake from Cakery API
    const requestData: ClientRequestData = {
        clientId,
        requestType: CakeryEndpoint.ORDERS,
        responseObj: response,
        reservationBody: foundClient.reservationBody
    };
    requestLimiterService.handleRequest(requestData);
};

const getTodaysDeliveries = async (request: Request, response: Response) => {
    const city = request.query.city as string;
    if (
        !city ||
        !['helsinki', 'espoo', 'vantaa'].includes(city.toLowerCase())
    ) {
        throw new Error(ReservationBodyError.CITY_QUERY);
    }

    const r = await databaseService.getTodaysDeliveries(city.toLowerCase());
    response.json(r);
};

const getTodaysBirthdayPeople = async (
    _request: Request,
    response: Response
) => {
    const r = await databaseService.getTodaysBirthdayPeople();
    response.json(r);
};

export default {
    checkCakeStock,
    reserveCake,
    reserveCakeSse,
    getTodaysDeliveries,
    getTodaysBirthdayPeople
};
