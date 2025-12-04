import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { config } from './env';
dotenv.config();

cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
});


/**
 * Upload a file buffer to Cloudinary
 * @param buffer file buffer from multer
 * @param folder folder name in Cloudinary
 * @returns uploaded file URL
 */
export const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error || !result) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};