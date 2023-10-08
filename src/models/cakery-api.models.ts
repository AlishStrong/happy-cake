import { AxiosHeaders, AxiosResponse } from 'axios';

export interface Cake {
    name: string;
    quantity: number;
}

export interface CakeData {
    data: Cake[];
}

export interface CakeryApiRequestBody {
    key: string;
}

export interface CakeryApiPostRequestBody extends CakeryApiRequestBody {
    cake: string;
}

export interface CakeryApiHeaders extends AxiosHeaders {
    Authorization: string;
    'Content-Type': 'application/json';
}

export interface CakeryApiResponse extends AxiosResponse<CakeData> {}
