import mysql from 'mysql2/promise';
import {
    DatabaseErrors,
    TodayBirthdayPeople,
    TodayDelivery
} from '../models/database.models';
import { ReservationBody } from '../models/models';

const executeQuery = async <T>(
    sqlQuery: string,
    params?: unknown[]
): Promise<T> => {
    const connection = await mysql
        .createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'caker',
            port: +(process.env.MYSQL_PORT || '3306'),
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_SCHEMA || 'happycake'
        })
        .catch((error: unknown) => {
            console.error(
                'Database Connection error',
                (error as Error).message
            );
            throw new Error(DatabaseErrors.UNAVAILABLE);
        });

    try {
        const result = await connection.execute(sqlQuery, params);
        return result[0] as T;
    } catch (error: unknown) {
        console.error('Database error', (error as Error).message);
        throw new Error(DatabaseErrors.QUERY);
    } finally {
        await connection.end();
    }
};

const saveReservation = async (
    resrvationBody: ReservationBody,
    orderId: string
) => {
    const {
        cake,
        name,
        birthday,
        address,
        city,
        image,
        message,
        youtube,
        twitter
    } = resrvationBody;
    const [bYear, bMonth, bDate] = birthday.split('-');
    const insertQuery =
        'INSERT INTO `reservations` (`cake`, `name`, `byear`, `bmonth`, `bdate`, `address`, `city`, `image`, `message`, `youtube`, `twitter`, `ordernumber`) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await executeQuery(insertQuery, [
        cake,
        name,
        bYear,
        bMonth,
        bDate,
        address,
        city,
        image || null,
        message || null,
        youtube || null,
        twitter || null,
        orderId
    ]);
};

const getTodaysDeliveries = async (city: string) => {
    const current = new Date();
    const curMonth = current.getMonth() + 1; // January is 0
    const curDate = current.getDate();
    let selectQuery =
        'SELECT `name`, `address`, `image`, `message`, `youtube`, `twitter`, `cake`, `ordernumber` FROM `reservations` ' +
        'WHERE `status` = "processing" AND `city` = ? AND `bmonth` = ? AND `bdate` = ?';
    let params = [city, curMonth, curDate];

    // if today is the 1st of March, then include born on the 29th of February
    if (curDate === 1 && curMonth === 3) {
        selectQuery =
            'SELECT `name`, `address`, `image`, `message`, `youtube`, `twitter`, `cake`, `ordernumber` FROM `reservations` ' +
            'WHERE `status` = "processing" AND `city` = ? AND ((`bmonth` = 3 AND `bdate` = 1) OR (`bmonth` = 2 AND `bdate` = 29))';
        params = [city];
    }

    const result = await executeQuery<TodayDelivery[]>(selectQuery, params);
    return result;
};

// name and address of same the month and date, and with delivered status
const getTodaysBirthdayPeople = async () => {
    const current = new Date();
    const curMonth = current.getMonth() + 1; // January is 0
    const curDate = current.getDate();

    let selectQuery =
        'SELECT `name`, `address` FROM `reservations` ' +
        'WHERE `status` = "delivered" AND `bmonth` = ? AND `bdate` = ?';
    let params = [curMonth, curDate];

    // if today is the 1st of March, then include those who were born on the 29th of February
    if (curDate === 1 && curMonth === 3) {
        selectQuery =
            'SELECT `name`, `address` FROM `reservations` ' +
            'WHERE `status` = "delivered" AND ((`bmonth` = 3 AND `bdate` = 1) OR (`bmonth` = 2 AND `bdate` = 29))';
        params = [];
    }

    const result = await executeQuery<TodayBirthdayPeople>(selectQuery, params);

    return result;
};

export default {
    saveReservation,
    getTodaysDeliveries,
    getTodaysBirthdayPeople
};
