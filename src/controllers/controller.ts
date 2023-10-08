import { Request, Response } from 'express';
import axios from 'axios';
import config from '../utils/cakery-api.config';
import {
    CakeData,
    CakeryApiPostRequestBody,
    CakeryApiRequestBody,
    CakeryApiResponse
} from '../models/cakery-api.models';
import { ReservationBody } from '../models/models';
import validators from '../utils/validators';

const headers = config.cakeryApiHeaders;

const checkCakeStock = (_request: Request, response: Response): void => {
    const data = config.cakeryApiGetRequestData;

    axios
        .get<CakeData, CakeryApiResponse, CakeryApiRequestBody>(
            config.cakeryUrl + 'cakes',
            {
                headers,
                data
            }
        )
        .then((r) => response.status(200).json(r.data.data))
        .catch((_e) => {
            throw new Error('Could not get data about Cake Stocks');
        });
};

const reserveCake = (request: Request, response: Response): void => {
    console.log('request.body', request.body);
    const reservationBody: ReservationBody = validators.toReservationBody(
        request.body
    );
    const data: CakeryApiPostRequestBody = {
        ...config.cakeryApiGetRequestData,
        cake: reservationBody.cake
    };
    console.log('data', data);
    response.status(202).json(data);
};

export default {
    checkCakeStock,
    reserveCake
};
