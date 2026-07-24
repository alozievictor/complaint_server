import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
const transporter = hasSmtp
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
        },
    })
    : null;
export async function sendComplaintConfirmation(to, referenceCode) {
    if (!transporter || !to)
        return;
    await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: `Complaint received: ${referenceCode}`,
        text: `Your complaint has been received. Your reference code is ${referenceCode}. Use it to track your complaint status.`,
    });
}
export async function sendStatusUpdate(to, referenceCode, status, response) {
    if (!transporter || !to)
        return;
    await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: `Complaint status updated: ${referenceCode}`,
        text: `Your complaint is now ${status.replace('_', ' ')}.${response ? `\n\nAdmin response: ${response}` : ''}`,
    });
}
