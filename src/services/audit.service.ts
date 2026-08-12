import { AuditLogModel, type AuditLogDocument } from '../models/AuditLog.js';

export type AuditInput = {
  actorType: 'admin' | 'student' | 'system';
  actorId?: string;
  actorName?: string;
  action: string;
  complaintId?: string;
  complaintReference?: string;
  adminId?: string;
  targetLabel?: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
};

export async function recordAuditLog(input: AuditInput) {
  try {
    await AuditLogModel.create(input);
  } catch (error) {
    // Auditing must not make the complaint/admin operation fail.
    console.error('Failed to write audit log', error);
  }
}

export function presentAuditLog(log: AuditLogDocument) {
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
