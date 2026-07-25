import multer from 'multer';
import { HttpError } from '../utils/httpError.js';
const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            cb(new HttpError(400, 'Unsupported attachment type', 'UNSUPPORTED_FILE'));
            return;
        }
        cb(null, true);
    },
});
