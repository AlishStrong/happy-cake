import { AxiosHeaders } from 'axios';
import {
    CakeryApiHeaders,
    CakeryApiRequestBody
} from '../models/cakery-api.models';

const AUTHORIZATION_KEY = process.env.AUTHORIZATION_KEY ?? '';
const REQUEST_BODY_KEY = process.env.REQUEST_BODY_KEY ?? '';

const cakeryApiHeaders: CakeryApiHeaders = new AxiosHeaders({
    Authorization: AUTHORIZATION_KEY,
    Accept: 'text/html; charset=utf-8',
    'Content-Type': 'application/json'
}) as CakeryApiHeaders;

const cakeryApiGetRequestData: CakeryApiRequestBody = {
    key: REQUEST_BODY_KEY
};

export const cakeryUrl = 'https://api.cakery.dev/';
export const cakeryCakes = 'cakes';
export const cakeryOrders = 'orders';

export default {
    cakeryApiHeaders,
    cakeryApiGetRequestData,
    cakeryUrl
};
