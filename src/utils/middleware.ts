import { NextFunction, Request, Response } from 'express';

const errorHandler = (
    error: Error,
    _request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const errors = JSON.parse(error.message) as object[];
        response.status(400).json({ errors });
    } catch (_) {
        response.status(400).json({ errors: [error.message] });
    }

    next(error);
};

export default {
    errorHandler
};
