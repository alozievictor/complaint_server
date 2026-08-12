import { AuditLogModel } from '../models/AuditLog.js';
export async function recordAuditLog(input) {
    try {
        await AuditLogModel.create(input);
    }
    catch (error) {
        // Auditing must not make the complaint/admin operation fail.
        console.error('Failed to write audit log', error);
    }
}
export function presentAuditLog(log) {
    return {
        id: log._id.toString(),
        actorType: log.actorType,
        actorId: log.actorId?.toString(),
        actorName: log.actorName,
        action: log.action,
        complaintId: log.complaintId?.toString(),
        complaintReference: log.complaintReference,
        adminId: log.adminId?.toString(),
        targetLabel: log.targetLabel,
        previousValue: log.previousValue,
        newValue: log.newValue,
        metadata: log.metadata,
        createdAt: log.createdAt,
    };
}
