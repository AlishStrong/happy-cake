import multer from 'multer';
import { ImageMimeTypes, ReservationBodyError } from '../models/models';

const sizeLimit = process.env.SIZE_LIMIT
    ? +process.env.SIZE_LIMIT
    : 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: { fileSize: sizeLimit },
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
