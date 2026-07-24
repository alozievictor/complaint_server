import { Router } from 'express';
import { createAdmin, listAdmins, updateAdmin } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('super'));
adminRouter.get('/', asyncHandler(listAdmins));
adminRouter.post('/', asyncHandler(createAdmin));
adminRouter.patch('/:id', asyncHandler(updateAdmin));
