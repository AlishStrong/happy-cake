import { AxiosHeaders, AxiosResponse } from 'axios';
import { cakeryCakes, cakeryOrders } from '../utils/cakery-api.config';

export const enum CakeryEndpoint {
    CAKES = cakeryCakes,
    ORDERS = cakeryOrders
}

export interface Cake {
    name: string;
    quantity: number;
}

export interface CakeData {
    data?: Cake[]; // present if GET request to /cakes responded with status 200
    message?: string; // present if GET request to /cakes responded with status 500
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

export type CakeryApiCakesResponse = AxiosResponse<CakeData>;

export interface CakeOrder {
    order_id: string;
}

export interface OrderData {
    data?: CakeOrder; // present if POST request to /orders responded with status 200
    message?: string; // present if POST request to /orders responded with status 500
}

export type CakeryApiOrdersResponse = AxiosResponse<OrderData>;

export type CakeryApiResponse =
    | CakeryApiCakesResponse
    | CakeryApiOrdersResponse;

export enum CakeryApiErrors {
    TOO_MANY = 'Cakery API is overloaded with requests and returned 429',
    DEAD = 'Issue with Cakery API (probably dead)'
}
