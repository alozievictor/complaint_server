export const complaintCategories = ['academic', 'finance', 'hostel', 'ict', 'general'] as const;
export const complaintStatuses = ['pending', 'under_review', 'resolved', 'closed'] as const;
export const adminRoles = ['academic', 'finance', 'hostel', 'ict', 'general', 'super'] as const;
export const assignableAdminRoles = ['academic', 'finance', 'hostel', 'ict', 'general'] as const;

export type ComplaintCategory = (typeof complaintCategories)[number];
export type ComplaintStatus = (typeof complaintStatuses)[number];
export type AdminRole = (typeof adminRoles)[number];
