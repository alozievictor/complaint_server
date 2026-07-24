import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AdminModel } from '../models/Admin.js';
import { loginSchema } from '../validators/auth.validators.js';
import { HttpError } from '../utils/httpError.js';
import { presentAdmin } from '../services/presenter.service.js';
export async function login(req, res) {
    const data = loginSchema.parse(req.body);
    const identifier = data.username.toLowerCase();
    const admin = await AdminModel.findOne({
        $or: [{ username: identifier }, { email: identifier }],
    }).select('+passwordHash');
    if (!admin || !admin.isActive || !(await admin.comparePassword(data.password))) {
        throw new HttpError(401, 'Invalid username or password', 'INVALID_CREDENTIALS');
    }
    const signOptions = { expiresIn: env.JWT_EXPIRES_IN };
    const token = jwt.sign({ sub: admin._id.toString(), role: admin.role }, env.JWT_SECRET, signOptions);
    res.json({ token, admin: presentAdmin(admin) });
}
export async function me(req, res) {
    res.json({ admin: req.user });
}
