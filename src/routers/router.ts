/* eslint-disable @typescript-eslint/no-misused-promises */
import express from 'express';
import controller from '../controllers/controller';
import { upload } from '../services/multer.service';

const router = express.Router();

router.get('/cake-stock', controller.checkCakeStock);
router.post('/reserve', upload.single('image'), controller.reserveCake); // PART 1 of the Cake Reservation process
router.get('/reserve/:id', controller.reserveCakeSse); // PART 2 of the Cake Reservation process
router.get('/deliveries-today', controller.getTodaysDeliveries);
router.get('/today-birthdays', controller.getTodaysBirthdayPeople);

export default router;
