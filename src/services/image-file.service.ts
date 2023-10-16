import sharp from 'sharp';
import { ReservationBodyError } from '../models/models';
import { unlinkSync } from 'fs';

const IMAGES_DIR = './images/';
const IPAD_AIR_WIDTH = 1024;

/**
 * Asynchronously save an image file into @see IMAGES_DIR directory
 * The final file name will be UUID of the client's request and the original extension
 * The final image will be also a resized version of its original file
 * to better fit the dispplay of iPad and break the bites of possible malicious content
 *
 * @param file
 * @param clientId UUID string generated for a given client's request
 * @returns the name (with extension) of the persisted image file. E.g.:
 * 'eb71414e-2b0a-4e45-90da-334de41d25ff.png'
 */
const processReservationBodyImage = async (
    file: Express.Multer.File,
    clientId: string
): Promise<string> => {
    const fileExtension = file?.originalname.split('.').pop();
    const imageName = clientId + '.' + fileExtension;
    await sharp(file?.buffer)
        .resize({
            width: IPAD_AIR_WIDTH,
            fit: 'inside'
        })
        .toFile(IMAGES_DIR + imageName)
        .catch((_e) => {
            throw new Error(JSON.stringify([ReservationBodyError.IMAGE_FILE]));
        });

    return imageName;
};

/**
 * Synchronously delete an image file inside @see IMAGES_DIR
 *
 * @param imageFile name of tha file with extension and the name should be a UUID string. E.g.:
 * 'eb71414e-2b0a-4e45-90da-334de41d25ff.png'
 */
const deleteReservationBodyImage = (imageFile: string) => {
    unlinkSync(IMAGES_DIR + imageFile);
};

export default {
    processReservationBodyImage,
    deleteReservationBodyImage
};
