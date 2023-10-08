export type DeliveryCity = 'Helsinki' | 'Espoo' | 'Vantaa';

export interface ReservationBody {
    cake: string;
    name: string;
    birthday: Date;
    address: string;
    city: DeliveryCity;
    message?: string; // text, simple safe HTML, youtube embeds, and twitter embeds.
    // Make it safe to display in a user's browser, as we may also display it on the web.
}
