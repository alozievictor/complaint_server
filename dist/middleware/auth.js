import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AdminModel } from '../models/Admin.js';
import { HttpError } from '../utils/httpError.js';
export const requireAuth = async (req, _res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token)
        return next(new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'));
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        const admin = await AdminModel.findById(payload.sub);
        if (!admin || !admin.isActive) {
            return next(new HttpError(401, 'Admin account is inactive or missing', 'AUTH_INVALID'));
        }
        req.user = {
            id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            username: admin.username,
            role: admin.role,
        };
        return next();
    }
    catch {
        return next(new HttpError(401, 'Invalid or expired token', 'AUTH_INVALID'));
    }
};
export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            return next(new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'));
        if (!roles.includes(req.user.role)) {
            return next(new HttpError(403, 'You do not have access to this resource', 'FORBIDDEN'));
        }
        return next();
    };
}
