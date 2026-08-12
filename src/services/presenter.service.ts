import type { ComplaintDocument } from '../models/Complaint.js';
import type { AdminRole } from '../types/domain.js';
import { getSlaDates, isNearDeadline } from './sla.service.js';

function presentSla(complaint: ComplaintDocument) {
  const fallback = getSlaDates(complaint.createdAt);
  const firstResponseDueAt = complaint.firstResponseDueAt ?? fallback.firstResponseDueAt;
  const resolutionDueAt = complaint.resolutionDueAt ?? fallback.resolutionDueAt;
  const now = new Date();
  return {
    firstResponseAt: complaint.firstResponseAt,
    firstResponseDueAt,
    resolutionDueAt,
    firstResponseOverdue: !complaint.firstResponseAt && firstResponseDueAt < now,
    resolutionOverdue: !['resolved', 'closed'].includes(complaint.status) && resolutionDueAt < now,
    nearingDeadline: !['resolved', 'closed'].includes(complaint.status) && (isNearDeadline(firstResponseDueAt, now) || isNearDeadline(resolutionDueAt, now)),
  };
}

export function presentAdmin(admin: {
  _id: { toString(): string };
  name: string;
  username: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
}) {
  return {
    id: admin._id.toString(),
    name: admin.name,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    isActive: admin.isActive,
  };
}

export function presentComplaintForStudent(complaint: ComplaintDocument) {
  return {
    id: complaint._id.toString(),
    referenceCode: complaint.referenceCode,
    trackingToken: complaint.trackingToken,
    category: complaint.category,
    subject: complaint.subject,
    description: complaint.description,
    isAnonymous: complaint.isAnonymous,
    realName: '',
    realEmail: complaint.notificationEmail ? 'provided' : '',
    anonymousLabel: complaint.isAnonymous ? complaint.anonymousLabel : '',
    status: complaint.status,
    submittedAt: complaint.createdAt,
    adminResponse: complaint.adminResponse,
    messages: complaint.messages.map(message => ({
      sender: message.sender,
      body: message.body,
      createdAt: message.createdAt,
    })),
    internalNotes: '',
  };
}

export function presentComplaintForAdmin(complaint: ComplaintDocument, role: AdminRole) {
  const canSeeCategory = role === 'super' || role === complaint.category;
  if (!canSeeCategory) return null;

  return {
    id: complaint._id.toString(),
    referenceCode: complaint.referenceCode,
    category: complaint.category,
    subject: complaint.subject,
    description: complaint.description,
    isAnonymous: complaint.isAnonymous,
    realName: complaint.isAnonymous ? '' : complaint.realName,
    realEmail: complaint.isAnonymous ? '' : complaint.realEmail,
    anonymousLabel: complaint.isAnonymous ? complaint.anonymousLabel : '',
    status: complaint.status,
    submittedAt: complaint.createdAt,
    adminResponse: complaint.adminResponse,
    messages: complaint.messages.map(message => ({
      sender: message.sender,
      body: message.body,
      createdAt: message.createdAt,
    })),
    attachments: complaint.attachments.map((attachment, index) => ({
      id: String(index),
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
    })),
    internalNotes: complaint.internalNotes,
    sla: presentSla(complaint),
  };
}
