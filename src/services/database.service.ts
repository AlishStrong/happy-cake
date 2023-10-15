import database from '../database/database';
import { ReservationBody, TodayDelivery } from '../models/models';

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
        'INSERT INTO `reservations` (`cake`, `name`, `byear`, `bmonth`, `bdate`, `address`, `city`, `image`, `message`, `youtube`, `twitter`, `ordernumber`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await database.executeQuery(insertQuery, [
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
        'SELECT `name`, `address`, `image`, `message`, `youtube`, `twitter`, `cake`, `ordernumber` FROM `reservations` WHERE `status` = "processing" AND `city` = ? AND `bmonth` = ? AND `bdate` = ?';
    let params = [city, curMonth, curDate];

    // if todays is the 1st of March, then include born on the 29th of February
    if (curDate === 1 && curMonth === 3) {
        selectQuery =
            'SELECT `name`, `address`, `image`, `message`, `youtube`, `twitter`, `cake`, `ordernumber` FROM `reservations` WHERE `status` = "processing" AND `city` = ? AND ((`bmonth` = 3 AND `bdate` = 1) OR (`bmonth` = 2 AND `bdate` = 29))';
        params = [city];
    }

    const result = await database.executeQuery<TodayDelivery[]>(
        selectQuery,
        params
    );

    return result;
};

export default {
    saveReservation,
    getTodaysDeliveries
};
