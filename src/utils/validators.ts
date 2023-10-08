import { DeliveryCity, ReservationBody } from '../models/models';

const isString = (text: unknown): text is string => {
    return typeof text === 'string' || text instanceof String;
};

const isDate = (date: string): boolean => {
    return Boolean(Date.parse(date));
};

const parseCake = (cake: unknown): string => {
    if (!cake || !isString(cake)) {
        throw new Error('Incorrect or missing cake type');
    }

    return cake;
};

const parseName = (name: unknown): string => {
    if (!name || !isString(name)) {
        throw new Error("Incorrect or missing recipient's name");
    }

    return name;
};

const parseBirthday = (birthday: unknown): Date => {
    if (!birthday || !isString(birthday) || !isDate(birthday)) {
        throw new Error("Incorrect or missing recipient's birthday date");
    }
    return new Date(birthday);
};

const parseAddress = (address: unknown): string => {
    if (!address || !isString(address)) {
        throw new Error("Incorrect or missing recipient's address");
    }

    return address;
};

const parseCity = (city: unknown): DeliveryCity => {
    if (city === 'Helsinki' || city === 'Espoo' || city === 'Vantaa') {
        return city;
    } else {
        throw new Error(
            'Delivery can be made only to Helsinki, Espoo, or Vantaa'
        );
    }
};

// TODO: complex check for safety
// text, simple safe HTML, youtube embeds, and twitter embeds.
// Make it safe to display in a user's browser, as we may also display it on the web.
const parseMessage = (message: unknown): string => {
    return isString(message) ? message : '';
};

const toReservationBody = (body: unknown): ReservationBody => {
    if (!body || typeof body !== 'object') {
        throw new Error('Incorrect or missing data');
    }

    if (
        'cake' in body &&
        'name' in body &&
        'birthday' in body &&
        'address' in body &&
        'city' in body
    ) {
        const reservationBody: ReservationBody = {
            cake: parseCake(body.cake),
            name: parseName(body.name),
            birthday: parseBirthday(body.birthday),
            address: parseAddress(body.address),
            city: parseCity(body.city),
            message: 'message' in body ? parseMessage(body.message) : ''
        };

        return reservationBody;
    } else {
        throw new Error('Incorrect data: some fields are missing');
    }
};

export default {
    toReservationBody
};
