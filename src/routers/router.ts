import express from 'express';
import controller from '../controllers/controller';

const router = express.Router();

router.get('/cake-stock', controller.checkCakeStock);
router.post('/reserve', controller.reserveCake);

export default router;