import { OutgoingHttpHeaders } from 'http';

export type DeliveryCity = 'helsinki' | 'espoo' | 'vantaa';

export interface ReservationBody {
    cake: string;
    name: string;
    birthday: string; // in yyyy-mm-dd format
    address: string;
    city: DeliveryCity;
    image?: string;
    message?: string;
    youtube?: string;
    twitter?: string;
}

export enum ReservationBodyError {
    NO_DATA = 'Incorrect or missing reservation data',
    CAKE = 'Incorrect or missing cake type',
    NAME = "Incorrect or missing recipient's name",
    BIRTHDAY_DATE = "Incorrect or missing recipient's birthday date",
    BIRTHDAY = 'Cake can be reserved 1 day before the birthday!',
    ADDRESS = "Incorrect or missing recipient's address",
    CITY_NAME = 'Delivery can be made only to Helsinki, Espoo, or Vantaa',
    CITY_QUERY = 'Missing city query of Helsinki, Espoo, or Vantaa',
    CITY = "Incorrect or missing recipient's city",
    MESSAGE = 'Unsupported or unsafe message format',
    IMAGE_TYPE = 'Unsupported file type',
    IMAGE_FILE = 'The image was corrupted and rejected',
    YOUTUBE = 'Invalid YouTube video URL',
    X_TWITTER = 'Invalid X (Twitter) URL'
}

interface ClientDataForGet {
    clientId: string;
}

export interface ClientDataForPost extends ClientDataForGet {
    status: 'initialized' | 'processed'; // to prevent double processing
    reservationBody: ReservationBody;
}
export type ClientData = ClientDataForGet | ClientDataForPost;

export interface SseHeaders extends OutgoingHttpHeaders {
    'Content-Type': 'text/event-stream';
    Connection: 'keep-alive';
    'Cache-control': 'no-cache';
}

export interface MessageForClient {
    status: 'processing' | 'success' | 'error';
    message: string;
}

export enum DatabaseErrors {
    UNAVAILABLE = 'Unable to connect to the database',
    QUERY = 'Failed to perform query execution'
}

export interface TodayDelivery
    extends Pick<
        ReservationBody,
        | 'name'
        | 'address'
        | 'image'
        | 'message'
        | 'youtube'
        | 'twitter'
        | 'cake'
    > {
    ordernumber: string;
}
