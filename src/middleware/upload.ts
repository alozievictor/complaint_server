import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const uploadPath = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadPath, { recursive: true });

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadPath,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${nanoid(10)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new HttpError(400, 'Unsupported attachment type', 'UNSUPPORTED_FILE'));
      return;
    }
    cb(null, true);
  },
});
