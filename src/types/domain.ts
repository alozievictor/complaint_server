export const complaintCategories = ['academic', 'finance', 'hostel', 'ict', 'general'] as const;
export const complaintStatuses = ['pending', 'under_review', 'resolved'] as const;
export const adminRoles = ['academic', 'finance', 'hostel', 'ict', 'super'] as const;

export type ComplaintCategory = (typeof complaintCategories)[number];
export type ComplaintStatus = (typeof complaintStatuses)[number];
export type AdminRole = (typeof adminRoles)[number];
