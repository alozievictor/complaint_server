import { AuditLogModel } from '../models/AuditLog.js';
import { presentAuditLog } from '../services/audit.service.js';
import { HttpError } from '../utils/httpError.js';
import { z } from 'zod';
const auditQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    action: z.string().trim().max(100).optional(),
    complaintId: z.string().trim().optional(),
    adminId: z.string().trim().optional(),
});
export async function listAuditLogs(req, res) {
    if (!req.user || req.user.role !== 'super') {
        throw new HttpError(403, 'Only the Super Admin can view audit logs', 'FORBIDDEN');
    }
    const query = auditQuerySchema.parse(req.query);
    const filter = {};
    if (query.action)
        filter.action = query.action;
    if (query.complaintId)
        filter.complaintId = query.complaintId;
    if (query.adminId)
        filter.adminId = query.adminId;
    const skip = (query.page - 1) * query.limit;
    const [logs, total] = await Promise.all([
        AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
        AuditLogModel.countDocuments(filter),
    ]);
    res.json({
        logs: logs.map(presentAuditLog),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
    });
}
