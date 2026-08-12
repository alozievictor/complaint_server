import type { Request, Response } from 'express';
import { ComplaintModel } from '../models/Complaint.js';
import { createComplaintSchema, followUpMessageSchema, listComplaintsQuerySchema, trackComplaintSchema, updateComplaintSchema } from '../validators/complaint.validators.js';
import { generateAnonymousLabel, generateReferenceCode, generateTrackingToken } from '../services/reference.service.js';
import { presentComplaintForAdmin, presentComplaintForStudent } from '../services/presenter.service.js';
import { sendComplaintConfirmation, sendStatusUpdate } from '../services/mail.service.js';
import { HttpError, notFound } from '../utils/httpError.js';
import { complaintStatuses, type ComplaintCategory } from '../types/domain.js';
import { deleteComplaintAttachment, generateComplaintAttachmentUrl, uploadComplaintAttachment } from '../services/cloudinary.service.js';
import { recordAuditLog } from '../services/audit.service.js';
import { getSlaDates } from '../services/sla.service.js';

export async function createComplaint(req: Request, res: Response) {
  const data = createComplaintSchema.parse(req.body);
  const uploadedAttachment = req.file ? await uploadComplaintAttachment(req.file) : null;
  const attachment = uploadedAttachment ? [uploadedAttachment] : [];

  const referenceCode = await generateReferenceCode();
  const trackingToken = generateTrackingToken();
  const anonymousLabel = data.isAnonymous ? await generateAnonymousLabel() : '';
  const studentEmail = data.isAnonymous ? data.notificationEmail : data.realEmail;
  const slaDates = getSlaDates(new Date());

  let complaint;
  try {
    complaint = await ComplaintModel.create({
      referenceCode,
      trackingToken,
      category: data.category,
      subject: data.subject,
      description: data.description,
      isAnonymous: data.isAnonymous,
      realName: data.isAnonymous ? '' : data.realName,
      realEmail: data.isAnonymous ? '' : data.realEmail,
      notificationEmail: studentEmail,
      anonymousLabel,
      attachments: attachment,
      statusHistory: [{ status: 'pending', note: 'Complaint submitted' }],
      ...slaDates,
    });
  } catch (error) {
    if (uploadedAttachment) {
      await deleteComplaintAttachment(uploadedAttachment.publicId, uploadedAttachment.resourceType).catch(console.error);
    }
    throw error;
  }

  // Delivery must never turn an already-saved complaint into a failed submission.
  // The tracking code is also shown immediately in the confirmation screen.
  void sendComplaintConfirmation(studentEmail ?? '', complaint.trackingToken).catch((error: unknown) => {
    console.error(`Failed to send confirmation email for complaint ${complaint.referenceCode}`, error);
  });
  void recordAuditLog({
    actorType: 'student',
    action: 'complaint_created',
    complaintId: complaint._id.toString(),
    complaintReference: complaint.referenceCode,
    newValue: { category: complaint.category, status: complaint.status, isAnonymous: complaint.isAnonymous },
  });

  res.status(201).json({ complaint: presentComplaintForStudent(complaint) });
}

export async function trackComplaint(req: Request, res: Response) {
  const { trackingToken } = trackComplaintSchema.parse(req.params);
  const complaint = await ComplaintModel.findOne({ trackingToken: trackingToken.toUpperCase() });
  if (!complaint) throw notFound('No complaint found with that tracking code');
  res.json({ complaint: presentComplaintForStudent(complaint) });
}

export async function addFollowUpMessage(req: Request, res: Response) {
  const { trackingToken } = trackComplaintSchema.parse(req.params);
  const { message } = followUpMessageSchema.parse(req.body);
  const complaint = await ComplaintModel.findOne({ trackingToken: trackingToken.toUpperCase() });
  if (!complaint) throw notFound('No complaint found with that tracking code');
  if (complaint.status === 'closed') {
    throw new HttpError(409, 'This complaint is closed and cannot receive follow-up messages', 'COMPLAINT_CLOSED');
  }

  const previousStatus = complaint.status;
  complaint.messages.push({ sender: 'student', body: message, createdAt: new Date() });
  if (previousStatus === 'resolved') {
    complaint.status = 'under_review';
    complaint.resolvedAt = undefined;
    complaint.statusHistory.push({
      status: 'under_review',
      changedAt: new Date(),
      note: 'Student submitted a follow-up message',
    });
  }
  await complaint.save();
  void recordAuditLog({
    actorType: 'student',
    action: 'student_follow_up_added',
    complaintId: complaint._id.toString(),
    complaintReference: complaint.referenceCode,
    previousValue: { status: previousStatus },
    newValue: { status: complaint.status, message },
  });

  void sendStatusUpdate(complaint.notificationEmail, complaint.referenceCode, complaint.status, complaint.adminResponse).catch((error: unknown) => {
    console.error(`Failed to send follow-up notification for complaint ${complaint.referenceCode}`, error);
  });

  res.status(201).json({ complaint: presentComplaintForStudent(complaint) });
}

export async function listComplaints(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');

  const query = listComplaintsQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = {};

  if (req.user.role !== 'super') filter.category = req.user.role;
  if (query.category) {
    if (req.user.role !== 'super' && query.category !== req.user.role) {
      throw new HttpError(403, 'You cannot view another category', 'FORBIDDEN');
    }
    filter.category = query.category;
  }
  if (query.status) filter.status = query.status;
  if (query.dateFrom || query.dateTo) {
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);
    filter.createdAt = {
      ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
      ...(dateTo ? { $lte: dateTo } : {}),
    };
  }
  if (query.search) {
    const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { referenceCode: new RegExp(escapedSearch, 'i') },
      { subject: new RegExp(escapedSearch, 'i') },
      { anonymousLabel: new RegExp(escapedSearch, 'i') },
      { realName: new RegExp(escapedSearch, 'i') },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [complaints, total] = await Promise.all([
    ComplaintModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    ComplaintModel.countDocuments(filter),
  ]);
  const summaryFilter = { ...filter };
  delete summaryFilter.status;
  const [allCount, statusCounts] = await Promise.all([
    ComplaintModel.countDocuments(summaryFilter),
    Promise.all(
    complaintStatuses.map(async status => [status, await ComplaintModel.countDocuments({ ...filter, status })] as const),
    ),
  ]);
  res.json({
    complaints: complaints
      .map((complaint) => presentComplaintForAdmin(complaint, req.user!.role))
      .filter(Boolean),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
    counts: { all: allCount, ...Object.fromEntries(statusCounts) },
  });
}

export async function getComplaint(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');

  const complaint = await ComplaintModel.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');

  const presented = presentComplaintForAdmin(complaint, req.user.role);
  if (!presented) throw new HttpError(403, 'You cannot view this complaint', 'FORBIDDEN');

  res.json({ complaint: presented });
}

export async function getComplaintAttachment(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');

  const attachmentIndex = Number.parseInt(req.params.attachmentIndex, 10);
  if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
    throw new HttpError(400, 'Invalid attachment', 'INVALID_ATTACHMENT');
  }

  const complaint = await ComplaintModel.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');
  const presented = presentComplaintForAdmin(complaint, req.user.role);
  if (!presented) throw new HttpError(403, 'You cannot view this attachment', 'FORBIDDEN');

  const attachment = complaint.attachments[attachmentIndex];
  if (!attachment) throw notFound('Attachment not found');

  const url = generateComplaintAttachmentUrl(attachment.publicId, attachment.resourceType);
  res.json({ url });
}

export async function updateComplaint(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');

  const data = updateComplaintSchema.parse(req.body);
  const complaint = await ComplaintModel.findById(req.params.id);
  if (!complaint) throw notFound('Complaint not found');

  const isCategoryAdmin = req.user.role !== 'super';
  if (isCategoryAdmin && complaint.category !== req.user.role) {
    throw new HttpError(403, 'You cannot update this complaint', 'FORBIDDEN');
  }

  if (data.category && req.user.role !== 'super') {
    throw new HttpError(403, 'Only the Super Admin can reassign categories', 'FORBIDDEN');
  }

  const previousStatus = complaint.status;
  const previousResponse = complaint.adminResponse;
  const previousCategory = complaint.category;
  if (previousStatus === 'closed' && data.status && data.status !== 'closed') {
    throw new HttpError(409, 'Closed complaints are terminal and cannot be reopened', 'COMPLAINT_CLOSED');
  }
  if (data.status) complaint.status = data.status;
  if (data.adminResponse !== undefined) {
    const nextResponse = data.adminResponse.trim();
    if (nextResponse && nextResponse !== complaint.adminResponse.trim()) {
      complaint.messages.push({ sender: 'admin', body: nextResponse, createdAt: new Date() });
    }
    complaint.adminResponse = nextResponse;
    if (nextResponse && !complaint.firstResponseAt) complaint.firstResponseAt = new Date();
  }
  if (data.internalNotes !== undefined) complaint.internalNotes = data.internalNotes;
  if (data.category) complaint.category = data.category as ComplaintCategory;
  if (data.status === 'resolved' && previousStatus !== 'resolved') complaint.resolvedAt = new Date();

  if (data.status && data.status !== previousStatus) {
    complaint.statusHistory.push({
      status: data.status,
      changedBy: req.user.id,
      changedAt: new Date(),
      note: data.adminResponse ?? '',
    });
  }

  await complaint.save();
  if (data.status && data.status !== previousStatus) {
    void recordAuditLog({
      actorType: 'admin', actorId: req.user.id, actorName: req.user.name,
      action: 'complaint_status_changed', complaintId: complaint._id.toString(), complaintReference: complaint.referenceCode,
      previousValue: previousStatus, newValue: data.status,
    });
  }
  if (data.adminResponse !== undefined && data.adminResponse.trim() !== previousResponse.trim()) {
    void recordAuditLog({
      actorType: 'admin', actorId: req.user.id, actorName: req.user.name,
      action: 'admin_response_added', complaintId: complaint._id.toString(), complaintReference: complaint.referenceCode,
      previousValue: previousResponse, newValue: data.adminResponse.trim(),
    });
  }
  if (data.category && data.category !== previousCategory) {
    void recordAuditLog({
      actorType: 'admin', actorId: req.user.id, actorName: req.user.name,
      action: 'complaint_category_reassigned', complaintId: complaint._id.toString(), complaintReference: complaint.referenceCode,
      previousValue: previousCategory, newValue: data.category,
    });
  }
  void sendStatusUpdate(complaint.notificationEmail, complaint.referenceCode, complaint.status, complaint.adminResponse).catch((error: unknown) => {
    console.error(`Failed to send status update email for complaint ${complaint.referenceCode}`, error);
  });

  res.json({ complaint: presentComplaintForAdmin(complaint, req.user.role) });
}
