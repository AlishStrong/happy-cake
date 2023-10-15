import { Response } from 'express';
import { CakeryApiResponse, CakeryEndpoint } from './cakery-api.models';
import { ReservationBody } from './models';

export interface ProcessedRequest {
    clientId: string;
    promise: Promise<CakeryApiResponse>;
}

interface ClientRequestDataBase {
    clientId: string;
    responseObj: Response;
}

interface ClientGetRequestData extends ClientRequestDataBase {
    requestType: CakeryEndpoint.CAKES;
}

interface ClientPostRequestData extends ClientRequestDataBase {
    requestType: CakeryEndpoint.ORDERS;
    reservationBody: ReservationBody;
}

export type ClientRequestData = ClientGetRequestData | ClientPostRequestData;
