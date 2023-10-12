import express from 'express';
import controller from '../controllers/controller';

const router = express.Router();

router.get('/cake-stock', controller.checkCakeStock);
router.get('/reserve/:id', controller.reserveCakeSse); // PART 1 of the Cake Reservation process
router.post('/reserve', controller.reserveCake); // PART 2 of the Cake Reservation process

export default router;
