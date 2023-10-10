/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction, Request, Response } from 'express';

const errorHandler = (
    error: Error,
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (
        request.url.includes('/reserve') &&
        ['POST', 'GET'].includes(request.method)
    ) {
        response.status(400).json({ errors: JSON.parse(error.message) });
    }

    next(error);
};

export default {
    errorHandler
};
