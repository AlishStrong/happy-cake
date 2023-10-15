/* eslint-disable @typescript-eslint/no-misused-promises */
import express from 'express';
import controller from '../controllers/controller';
import multer from 'multer';
import { ReservationBodyError } from '../models/models';

enum ImageMimeTypes {
    PNG = 'image/png',
    JPG = 'image/jpg',
    JPEG = 'image/jpeg',
    GIF = 'image/gif'
}

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const error: Error = new Error(
            JSON.stringify([ReservationBodyError.IMAGE_TYPE])
        );
        const mimetypes = Object.values<string>(ImageMimeTypes);
        const extensions = mimetypes.map((t) => t.split('/').pop());
        const fileExtension = file.originalname.split('.').pop();
        if (
            mimetypes.includes(file.mimetype) &&
            extensions.includes(fileExtension)
        ) {
            cb(null, true);
        } else {
            cb(error);
        }
    }
});

const router = express.Router();

router.get('/cake-stock', controller.checkCakeStock);
router.post('/reserve', upload.single('image'), controller.reserveCake); // PART 1 of the Cake Reservation process
router.get('/reserve/:id', controller.reserveCakeSse); // PART 2 of the Cake Reservation process
router.get('/deliveries-today', controller.getTodaysDeliveries);

export default router;
