import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/Admin.js';
import { createAdminSchema, updateAdminSchema } from '../validators/admin.validators.js';
import { presentAdmin } from '../services/presenter.service.js';
import { HttpError, notFound } from '../utils/httpError.js';

export async function listAdmins(_req: Request, res: Response) {
  const admins = await AdminModel.find().sort({ role: 1, name: 1 });
  res.json({ admins: admins.map(presentAdmin) });
}

export async function createAdmin(req: Request, res: Response) {
  const data = createAdminSchema.parse(req.body);
  const existing = await AdminModel.findOne({ $or: [{ username: data.username }, { email: data.email }] });
  if (existing) throw new HttpError(409, 'An admin with that username or email already exists', 'ADMIN_EXISTS');

  const passwordHash = await bcrypt.hash(data.password, 12);
  const admin = await AdminModel.create({
    ...data,
    passwordHash,
    isActive: data.isActive ?? true,
  });

  res.status(201).json({ admin: presentAdmin(admin) });
}

export async function updateAdmin(req: Request, res: Response) {
  const data = updateAdminSchema.parse(req.body);
  const admin = await AdminModel.findById(req.params.id);
  if (!admin) throw notFound('Admin not found');

  if (admin.role === 'super' && data.isActive === false) {
    throw new HttpError(400, 'Super Admin account cannot be deactivated', 'SUPER_ADMIN_PROTECTED');
  }

  Object.assign(admin, data);
  await admin.save();
  res.json({ admin: presentAdmin(admin) });
}
