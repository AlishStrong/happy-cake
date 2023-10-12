import { Response } from 'express';
import { CakeryApiResponse, CakeryEndpoint } from './cakery-api.models';

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
    requestType: CakeryEndpoint.ORDER;
    cake: string;
}

export type ClientRequestData = ClientGetRequestData | ClientPostRequestData;
