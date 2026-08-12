import { z } from 'zod';
import { assignableAdminRoles } from '../types/domain.js';
export const createAdminSchema = z.object({
    name: z.string().trim().min(2).max(120),
    username: z.string().trim().min(3).max(60).toLowerCase(),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(128),
    role: z.enum(assignableAdminRoles),
    isActive: z.boolean().optional(),
});
export const updateAdminSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    role: z.enum(assignableAdminRoles).optional(),
    isActive: z.boolean().optional(),
});
