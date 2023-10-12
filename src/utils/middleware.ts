/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction, Request, Response } from 'express';

const errorHandler = (
    error: Error,
    _request: Request,
    response: Response,
    next: NextFunction
) => {
    response.status(400).json({ errors: JSON.parse(error.message) });

    next(error);
};

export default {
    errorHandler
};
