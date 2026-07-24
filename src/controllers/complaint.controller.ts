import type { Request, Response } from 'express';
import { ComplaintModel } from '../models/Complaint.js';
import { createComplaintSchema, listComplaintsQuerySchema, trackComplaintSchema, updateComplaintSchema } from '../validators/complaint.validators.js';
import { generateAnonymousLabel, generateReferenceCode } from '../services/reference.service.js';
import { presentComplaintForAdmin, presentComplaintForStudent } from '../services/presenter.service.js';
import { sendComplaintConfirmation, sendStatusUpdate } from '../services/mail.service.js';
import { HttpError, notFound } from '../utils/httpError.js';
import type { ComplaintCategory } from '../types/domain.js';

export async function createComplaint(req: Request, res: Response) {
  const data = createComplaintSchema.parse(req.body);
  const attachment = req.file
    ? [{
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      }]
    : [];

  const referenceCode = await generateReferenceCode();
  const anonymousLabel = data.isAnonymous ? await generateAnonymousLabel() : '';
  const studentEmail = data.isAnonymous ? data.notificationEmail : data.realEmail;

  const complaint = await ComplaintModel.create({
    referenceCode,
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
  });

  await sendComplaintConfirmation(studentEmail ?? '', complaint.referenceCode);

  res.status(201).json({ complaint: presentComplaintForStudent(complaint) });
}

export async function trackComplaint(req: Request, res: Response) {
  const { referenceCode } = trackComplaintSchema.parse(req.params);
  const complaint = await ComplaintModel.findOne({ referenceCode: referenceCode.toUpperCase() });
  if (!complaint) throw notFound('No complaint found with that reference code');

  res.json({ complaint: presentComplaintForStudent(complaint) });
}

export async function listComplaints(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');

  const query = listComplaintsQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = {};

  if (req.user.role !== 'super') filter.category = req.user.role;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { referenceCode: new RegExp(query.search, 'i') },
      { subject: new RegExp(query.search, 'i') },
      { anonymousLabel: new RegExp(query.search, 'i') },
      { realName: new RegExp(query.search, 'i') },
    ];
  }

  const complaints = await ComplaintModel.find(filter).sort({ createdAt: -1 });
  res.json({
    complaints: complaints
      .map((complaint) => presentComplaintForAdmin(complaint, req.user!.role))
      .filter(Boolean),
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
  if (data.status) complaint.status = data.status;
  if (data.adminResponse !== undefined) complaint.adminResponse = data.adminResponse;
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
  await sendStatusUpdate(complaint.notificationEmail, complaint.referenceCode, complaint.status, complaint.adminResponse);

  res.json({ complaint: presentComplaintForAdmin(complaint, req.user.role) });
}
