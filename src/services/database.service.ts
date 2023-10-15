import database from '../database/database';
import { ReservationBody } from '../models/models';

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

export default {
    saveReservation
};
