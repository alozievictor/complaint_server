import { z } from 'zod';
import { complaintCategories, complaintStatuses } from '../types/domain.js';
const emailSchema = z.string().trim().email().optional().or(z.literal(''));
export const createComplaintSchema = z.object({
    category: z.enum(complaintCategories),
    subject: z.string().trim().min(3).max(160),
    description: z.string().trim().min(20).max(5000),
    isAnonymous: z.coerce.boolean().default(false),
    realName: z.string().trim().max(120).optional().default(''),
    realEmail: emailSchema.default(''),
    notificationEmail: emailSchema.default(''),
}).superRefine((data, ctx) => {
    if (!data.isAnonymous && !data.realName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['realName'], message: 'Name is required for identified complaints' });
    }
    if (!data.isAnonymous && !data.realEmail) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['realEmail'], message: 'Email is required for identified complaints' });
    }
    if (data.isAnonymous && !data.notificationEmail) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['notificationEmail'], message: 'Notification email is required for anonymous complaints' });
    }
});
export const trackComplaintSchema = z.object({
    trackingToken: z.string().trim().uuid('Invalid tracking code format'),
});
export const listComplaintsQuerySchema = z.object({
    status: z.enum(complaintStatuses).optional(),
    search: z.string().trim().optional(),
});
export const updateComplaintSchema = z.object({
    status: z.enum(complaintStatuses).optional(),
    adminResponse: z.string().trim().max(5000).optional(),
    internalNotes: z.string().trim().max(5000).optional(),
    category: z.enum(complaintCategories).optional(),
});
