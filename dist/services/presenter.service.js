export function presentAdmin(admin) {
    return {
        id: admin._id.toString(),
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
    };
}
export function presentComplaintForStudent(complaint) {
    return {
        id: complaint._id.toString(),
        referenceCode: complaint.referenceCode,
        trackingToken: complaint.trackingToken,
        category: complaint.category,
        subject: complaint.subject,
        description: complaint.description,
        isAnonymous: complaint.isAnonymous,
        realName: '',
        realEmail: complaint.notificationEmail ? 'provided' : '',
        anonymousLabel: complaint.isAnonymous ? complaint.anonymousLabel : '',
        status: complaint.status,
        submittedAt: complaint.createdAt,
        adminResponse: complaint.adminResponse,
        internalNotes: '',
    };
}
export function presentComplaintForAdmin(complaint, role) {
    const canSeeCategory = role === 'super' || role === complaint.category;
    if (!canSeeCategory)
        return null;
    return {
        id: complaint._id.toString(),
        referenceCode: complaint.referenceCode,
        category: complaint.category,
        subject: complaint.subject,
        description: complaint.description,
        isAnonymous: complaint.isAnonymous,
        realName: complaint.isAnonymous ? '' : complaint.realName,
        realEmail: complaint.isAnonymous ? '' : complaint.realEmail,
        anonymousLabel: complaint.isAnonymous ? complaint.anonymousLabel : '',
        status: complaint.status,
        submittedAt: complaint.createdAt,
        adminResponse: complaint.adminResponse,
        internalNotes: complaint.internalNotes,
    };
}
