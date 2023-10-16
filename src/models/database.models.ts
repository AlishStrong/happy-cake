import { ReservationBody } from './models';

export enum DatabaseErrors {
    UNAVAILABLE = 'Unable to connect to the database',
    QUERY = 'Failed to perform query execution'
}

export interface TodayDelivery
    extends Pick<
        ReservationBody,
        | 'name'
        | 'address'
        | 'image'
        | 'message'
        | 'youtube'
        | 'twitter'
        | 'cake'
    > {
    ordernumber: string;
}

export type TodayBirthdayPeople = Pick<ReservationBody, 'name' | 'address'>[];
