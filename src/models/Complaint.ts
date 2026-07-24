import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { complaintCategories, complaintStatuses } from "../types/domain.js";

const attachmentSchema = new Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: complaintStatuses, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const complaintSchema = new Schema(
  {
    referenceCode: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: complaintCategories,
      required: true,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    isAnonymous: { type: Boolean, required: true, default: false },
    realName: { type: String, trim: true, default: "" },
    realEmail: { type: String, trim: true, lowercase: true, default: "" },
    notificationEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    anonymousLabel: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: complaintStatuses,
      default: "pending",
      index: true,
    },
    adminResponse: { type: String, trim: true, default: "" },
    internalNotes: { type: String, trim: true, default: "" },
    attachments: { type: [attachmentSchema], default: [] },
    statusHistory: { type: [statusHistorySchema], default: [] },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

complaintSchema.index({ category: 1, status: 1, createdAt: -1 });
complaintSchema.index({ createdAt: -1 });

export type ComplaintDocument = InferSchemaType<typeof complaintSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ComplaintModel = mongoose.model("Complaint", complaintSchema);
