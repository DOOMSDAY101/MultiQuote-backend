import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Accept only jpg and png
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (!allowedTypes.includes(file.mimetype)) {
        const error: any = new Error('Only JPG and PNG files are allowed');
        error.status = 400; // optional
        return cb(error);
    }
    cb(null, true);
};

// Memory storage
const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter,
});

export const multerErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Only handle Multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Max 5 MB allowed.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ message: 'Unexpected file field.' });
        }
        return res.status(400).json({ message: err.message });
    }

    if (err) {
        return res.status(err.status || 400).json({ message: err.message || 'Invalid file upload' });
    }
    // Not a Multer error → pass it to the next error handler
    next(err);
};
