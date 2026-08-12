import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorType: { type: String, enum: ['admin', 'student', 'system'], required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    actorName: { type: String, trim: true, default: '' },
    action: { type: String, required: true, index: true },
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', index: true },
    complaintReference: { type: String, trim: true, default: '' },
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', index: true },
    targetLabel: { type: String, trim: true, default: '' },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);
