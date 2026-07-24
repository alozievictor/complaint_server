import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const analyticsRouter = Router();
analyticsRouter.get('/', requireAuth, requireRole('super'), asyncHandler(getAnalytics));
