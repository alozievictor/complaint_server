import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverRoot, '.env') });
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/lcocms'),
    JWT_SECRET: z.string().min(24).default('development-secret-change-before-production'),
    JWT_EXPIRES_IN: z.string().default('8h'),
    UPLOAD_DIR: z.string().default('uploads'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default('Lincoln College OCMS <no-reply@lincoln.edu>'),
});
export const env = envSchema.parse(process.env);
