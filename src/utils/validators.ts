import {
    DeliveryCity,
    ReservationBody,
    ReservationBodyError
} from '../models/models';

const isString = (text: unknown): text is string => {
    return typeof text === 'string' || text instanceof String;
};

const isDate = (date: string): boolean => {
    return Boolean(Date.parse(date));
};

const isNextDay = (birthday: string): boolean => {
    const currentDate = new Date();
    const birthdayDate = new Date(birthday);
    birthdayDate.setFullYear(currentDate.getFullYear());
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const difference = birthdayDate.getTime() - currentDate.getTime();
    return (
        birthdayDate.getDate() !== currentDate.getDate() &&
        difference > 0 &&
        difference <= oneDayInMs
    );
};

const parseCake = (cake: unknown): string => {
    if (!cake || !isString(cake) || !cake.trim()) {
        throw new Error(ReservationBodyError.CAKE);
    }

    return cake.trim();
};

const parseName = (name: unknown): string => {
    if (!name || !isString(name) || !name.trim()) {
        throw new Error(ReservationBodyError.NAME);
    }

    return name.trim();
};

const parseBirthday = (birthday: unknown): string => {
    if (!birthday || !isString(birthday) || !isDate(birthday)) {
        throw new Error(ReservationBodyError.BIRTHDAY_DATE);
    } else if (!isNextDay(birthday)) {
        throw new Error(ReservationBodyError.BIRTHDAY);
    }
    return new Date(birthday).toISOString().substring(0, 10);
};

const parseAddress = (address: unknown): string => {
    if (!address || !isString(address) || !address.trim()) {
        throw new Error(ReservationBodyError.ADDRESS);
    }

    return address.trim();
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

// TODO: complex check for safety
// text, simple safe HTML, youtube embeds, and twitter embeds.
// Make it safe to display in a user's browser, as we may also display it on the web.
const parseMessage = (message: unknown): string => {
    if (isString(message)) {
        return message;
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

export default {
    isString,
    isDate,
    isNextDay,
    parseCake,
    parseName,
    parseBirthday,
    parseAddress,
    parseCity,
    parseBodyFields,
    toReservationBody
};
