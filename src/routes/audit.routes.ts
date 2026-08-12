import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const auditRouter = Router();

auditRouter.get('/', requireAuth, requireRole('super'), asyncHandler(listAuditLogs));
