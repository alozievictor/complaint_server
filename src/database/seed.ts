import { connectDatabase } from './connect.js';
import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/Admin.js';
import { ComplaintModel } from '../models/Complaint.js';
import { CounterModel } from '../models/Counter.js';
import { randomUUID } from 'node:crypto';

const admins = [
  { name: 'Mrs. Jacob', username: 'academic', password: 'password123', role: 'academic', email: 'academic@lincoln.edu.gh' },
  { name: 'Mr. Asante', username: 'hostel', password: 'password123', role: 'hostel', email: 'hostel@lincoln.edu.gh' },
  { name: 'Ms. Mensah', username: 'finance', password: 'password123', role: 'finance', email: 'finance@lincoln.edu.gh' },
  { name: 'Mr. Boateng', username: 'ict', password: 'password123', role: 'ict', email: 'ict@lincoln.edu.gh' },
  { name: 'Dr. Owusu', username: 'superadmin', password: 'admin12345', role: 'super', email: 'admin@lincoln.edu.gh' },
] as const;

const complaints = [
  {
    referenceCode: 'LC-2026-0001',
    trackingToken: randomUUID().toUpperCase(),
    category: 'academic',
    subject: 'Unfair Grade Assessment in Calculus',
    description: 'My coursework was graded without proper feedback and I believe the score does not reflect the quality of my submission. I submitted all required work on time but received a failing grade with no explanation from the lecturer.',
    isAnonymous: false,
    realName: 'James Osei',
    realEmail: 'james.osei@lincoln.edu.gh',
    notificationEmail: 'james.osei@lincoln.edu.gh',
    status: 'under_review',
    internalNotes: 'Checking with the lecturer for the grading rubric and original submission.',
    createdAt: new Date('2026-06-20'),
  },
  {
    referenceCode: 'LC-2026-0002',
    trackingToken: randomUUID().toUpperCase(),
    category: 'hostel',
    subject: 'Water Supply Outage in Block C',
    description: 'There has been no running water in Block C, Rooms 14 to 20, for the past 5 days. We have reported to the hostel warden multiple times but no action has been taken. Students are struggling with basic hygiene.',
    isAnonymous: true,
    anonymousLabel: 'Anonymous312',
    status: 'pending',
    createdAt: new Date('2026-06-25'),
  },
  {
    referenceCode: 'LC-2026-0003',
    trackingToken: randomUUID().toUpperCase(),
    category: 'finance',
    subject: 'Double Charged for Accommodation Fee',
    description: 'I was charged twice for the second semester accommodation fee. I have bank receipts showing both transactions on the same date. Please investigate and refund the duplicate charge as soon as possible.',
    isAnonymous: false,
    realName: 'Abena Kwarteng',
    realEmail: 'abena.k@lincoln.edu.gh',
    notificationEmail: 'abena.k@lincoln.edu.gh',
    status: 'resolved',
    adminResponse: 'We have verified your payment records. The duplicate charge has been reversed and will reflect in your account within 3-5 business days.',
    internalNotes: 'Refund of GHS 850 processed on June 15, 2026.',
    resolvedAt: new Date('2026-06-15'),
    createdAt: new Date('2026-06-10'),
  },
  {
    referenceCode: 'LC-2026-0004',
    trackingToken: randomUUID().toUpperCase(),
    category: 'ict',
    subject: 'Student Portal Login Issues - Cannot Access Results',
    description: 'I have been unable to log into the student portal for 2 weeks. I cannot access my timetable, results, or academic resources. The error says "Invalid credentials" even after multiple password resets through the help desk.',
    isAnonymous: true,
    realEmail: '',
    notificationEmail: 'ama.antwi@gmail.com',
    anonymousLabel: 'Anonymous501',
    status: 'under_review',
    internalNotes: 'Found potential issue with SSO system for users with special characters in username.',
    createdAt: new Date('2026-06-28'),
  },
] as const;

await connectDatabase();

await Promise.all([
  AdminModel.deleteMany({}),
  ComplaintModel.deleteMany({}),
  CounterModel.deleteMany({}),
]);

for (const admin of admins) {
  await AdminModel.create({
    ...admin,
    passwordHash: await bcrypt.hash(admin.password, 12),
    password: undefined,
    isActive: true,
  });
}

await ComplaintModel.insertMany(complaints);
await CounterModel.insertMany([
  { name: 'complaint:2026', value: 4 },
  { name: 'anonymous', value: 501 },
]);

console.log('Seeded LCOCMS demo data');
process.exit(0);
