import { Request } from 'express';
import {
    DeliveryCity,
    ReservationBody,
    ReservationBodyError
} from '../models/models';

const isString = (text: unknown): text is string => {
    return typeof text === 'string' || text instanceof String;
};

const sanitizeString = (input: string): string => {
    return input.replace(/[;<>&'"\\]/g, '');
};

const isDate = (date: string): boolean => {
    return Boolean(Date.parse(date));
};

const isNextDay = (birthday: string): boolean => {
    const current = new Date();
    const curYear = current.getFullYear();
    const curMonth = current.getMonth() + 1; // January is 0
    const curDate = current.getDate();

    const [bYear, bMonth, bDay] = birthday.substring(0, 10).split('-');

    if (+bYear >= curYear) {
        return false;
    } else {
        const zeroCurrent = new Date([curYear, curMonth, curDate].join('-'));
        const zeroBirthday = new Date([curYear, bMonth, bDay].join('-'));
        const oneDayInMs = 24 * 60 * 60 * 1000;
        const difference = zeroBirthday.getTime() - zeroCurrent.getTime();

        return difference > 0 && difference <= oneDayInMs;
    }
};

const parseCake = (cake: unknown): string => {
    if (!cake || !isString(cake) || !cake.trim()) {
        throw new Error(ReservationBodyError.CAKE);
    }

    return sanitizeString(decodeURI(cake.trim()));
};

const parseName = (name: unknown): string => {
    if (!name || !isString(name) || !name.trim()) {
        throw new Error(ReservationBodyError.NAME);
    }

    return sanitizeString(name.trim());
};

const parseBirthday = (birthday: unknown): string => {
    if (!birthday || !isString(birthday) || !isDate(birthday)) {
        throw new Error(ReservationBodyError.BIRTHDAY_DATE);
    } else if (!isNextDay(birthday)) {
        throw new Error(ReservationBodyError.BIRTHDAY);
    }
    return sanitizeString(
        new Date(birthday.substring(0, 10)).toISOString().substring(0, 10)
    );
};

const parseAddress = (address: unknown): string => {
    if (!address || !isString(address) || !address.trim()) {
        throw new Error(ReservationBodyError.ADDRESS);
    }

    return sanitizeString(address.trim());
};

const parseCity = (city: unknown): DeliveryCity => {
    if (city && isString(city) && city.trim()) {
        city = city.trim().toLowerCase();
        if (city === 'helsinki' || city === 'espoo' || city === 'vantaa') {
            return city;
        } else {
            throw new Error(ReservationBodyError.CITY_NAME);
        }
    } else {
        throw new Error(ReservationBodyError.CITY);
    }
};

const parseMessage = (message: unknown): string => {
    if (isString(message)) {
        return sanitizeString(message.trim());
    } else {
        throw new Error(ReservationBodyError.MESSAGE);
    }
};

const parseBodyFields = (
    body: object,
    reservationBody: ReservationBody,
    errorMessages: string[]
) => {
    const reservationBodyFields: Array<keyof ReservationBody> = [
        'cake',
        'name',
        'birthday',
        'address',
        'city'
    ];

    reservationBodyFields.forEach((f) => {
        if (f in body) {
            try {
                if (f === 'cake' && f in body) {
                    reservationBody[f] = parseCake(body[f]);
                }
                if (f === 'name' && f in body) {
                    reservationBody[f] = parseName(body[f]);
                }
                if (f === 'birthday' && f in body) {
                    reservationBody[f] = parseBirthday(body[f]);
                }
                if (f === 'address' && f in body) {
                    reservationBody[f] = parseAddress(body[f]);
                }
                if (f === 'city' && f in body) {
                    reservationBody[f] = parseCity(body[f]);
                }
            } catch (error: unknown) {
                if (error instanceof Error) {
                    errorMessages.push(error.message);
                }
            }
        } else {
            errorMessages.push(`${f} field is missing`);
        }
    });

    if ('message' in body && body.message) {
        try {
            reservationBody.message = parseMessage(body.message);
        } catch (error: unknown) {
            if (error instanceof Error) {
                errorMessages.push(error.message);
            }
        }
    }

    if ('youtube' in body && body.youtube) {
        // Copied from youtube-url npm package;
        // Not used directly because TypeScript types were missing
        const youtubeUrlRegex =
            /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

        if (isString(body.youtube)) {
            const sanitizedUrl = sanitizeString(body.youtube.trim());
            if (sanitizedUrl.match(youtubeUrlRegex)) {
                reservationBody.youtube = sanitizedUrl;
            } else {
                errorMessages.push(ReservationBodyError.YOUTUBE);
            }
        } else {
            errorMessages.push(ReservationBodyError.YOUTUBE);
        }
    }

    if ('twitter' in body && body.twitter) {
        const XurlRegex =
            /^https?:\/\/(?:www\.)?x\.com\/(?:#!\/)?(\w+)\/status\/(\d+)(?:\?.*)?$/;

        if (isString(body.twitter)) {
            const sanitizedUrl = sanitizeString(body.twitter.trim());

            if (sanitizedUrl.match(XurlRegex)) {
                reservationBody.twitter = sanitizedUrl;
            } else {
                errorMessages.push(ReservationBodyError.X_TWITTER);
            }
        } else {
            errorMessages.push(ReservationBodyError.X_TWITTER);
        }
    }
};

const toReservationBody = (body: unknown): ReservationBody => {
    if (!body || typeof body !== 'object') {
        throw new Error(ReservationBodyError.NO_DATA);
    }

    const reservationBody = {} as ReservationBody;
    const errorMessages: string[] = [];

    parseBodyFields(body, reservationBody, errorMessages);

    if (errorMessages.length > 0) {
        throw new Error(JSON.stringify(errorMessages));
    }

    return reservationBody;
};

const checkAcceptHeaders = (request: Request) => {
    const acceptHeader = request.header('Accept');
    if (!acceptHeader || acceptHeader !== 'text/event-stream') {
        throw new Error(JSON.stringify(['Missing request headers']));
    }
};

export default {
    sanitizeString,
    isString,
    isDate,
    isNextDay,
    parseCake,
    parseName,
    parseBirthday,
    parseAddress,
    parseCity,
    parseMessage,
    parseBodyFields,
    toReservationBody,
    checkAcceptHeaders
};
