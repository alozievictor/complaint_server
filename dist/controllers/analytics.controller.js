import { ComplaintModel } from '../models/Complaint.js';
import { complaintCategories, complaintStatuses } from '../types/domain.js';
export async function getAnalytics(_req, res) {
    const [total, byStatus, byCategory, unresolvedAging] = await Promise.all([
        ComplaintModel.countDocuments(),
        ComplaintModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ComplaintModel.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
        ComplaintModel.countDocuments({
            status: { $ne: 'resolved' },
            createdAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
    ]);
    const statusCounts = Object.fromEntries(complaintStatuses.map((status) => [status, 0]));
    for (const row of byStatus)
        statusCounts[row._id] = row.count;
    const categoryCounts = Object.fromEntries(complaintCategories.map((category) => [category, 0]));
    for (const row of byCategory)
        categoryCounts[row._id] = row.count;
    const resolved = statusCounts.resolved ?? 0;
    res.json({
        total,
        resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
        byStatus: statusCounts,
        byCategory: categoryCounts,
        unresolvedAging,
    });
}
