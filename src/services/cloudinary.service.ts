import { v2 as cloudinary } from 'cloudinary';
import type { Express } from 'express';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type CloudinaryAttachment = {
  originalName: string;
  publicId: string;
  mimeType: string;
  resourceType: string;
  size: number;
  secureUrl: string;
};

function ensureConfigured() {
  if (!isConfigured) {
    throw new HttpError(503, 'Attachment storage is not configured', 'FILE_STORAGE_UNAVAILABLE');
  }
}

export async function uploadComplaintAttachment(file: Express.Multer.File): Promise<CloudinaryAttachment> {
  ensureConfigured();

  const result = await new Promise<{
    public_id: string;
    resource_type: string;
    bytes: number;
    secure_url: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'lcocms/complaints',
        resource_type: 'auto',
        type: 'authenticated',
      },
      (error, uploadResult) => {
        if (error) return reject(error);
        if (!uploadResult) return reject(new Error('Cloudinary did not return an upload result'));
        return resolve(uploadResult);
      },
    );

    stream.end(file.buffer);
  });

  return {
    originalName: file.originalname,
    publicId: result.public_id,
    mimeType: file.mimetype,
    resourceType: result.resource_type,
    size: result.bytes,
    secureUrl: result.secure_url,
  };
}

export async function deleteComplaintAttachment(publicId: string, resourceType: string) {
  if (!isConfigured) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    invalidate: true,
  });
}

export function generateComplaintAttachmentUrl(publicId: string, resourceType: string) {
  ensureConfigured();
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    secure: true,
    sign_url: true,
  });
}
