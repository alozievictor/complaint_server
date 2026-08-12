import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";
import { adminRoles } from "../types/domain.js";
const adminSchema = new Schema({
    name: { type: String, required: true, trim: true },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: adminRoles, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
adminSchema.methods.comparePassword = function comparePassword(password) {
    return bcrypt.compare(password, this.passwordHash);
};
adminSchema.index({ role: 1, isActive: 1 });
export const AdminModel = mongoose.model("Admin", adminSchema);
