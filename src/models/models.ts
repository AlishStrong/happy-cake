export type DeliveryCity = 'helsinki' | 'espoo' | 'vantaa';

export interface ReservationBody {
    cake: string;
    name: string;
    birthday: string; // in yyyy-mm-dd format
    address: string;
    city: DeliveryCity;
    message?: string; // text, simple safe HTML, youtube embeds, and twitter embeds.
    // Make it safe to display in a user's browser, as we may also display it on the web.
}

export enum ReservationBodyError {
    NO_DATA = 'Incorrect or missing reservation data',
    CAKE = 'Incorrect or missing cake type',
    NAME = "Incorrect or missing recipient's name",
    BIRTHDAY_DATE = "Incorrect or missing recipient's birthday date",
    BIRTHDAY = 'Cake can be reserved 1 day before the birthday!',
    ADDRESS = "Incorrect or missing recipient's address",
    CITY_NAME = 'Delivery can be made only to Helsinki, Espoo, or Vantaa',
    CITY = "Incorrect or missing recipient's city",
    MESSAGE = 'Unsupported or unsafe message format'
}
