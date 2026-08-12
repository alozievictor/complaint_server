import { ComplaintModel } from '../models/Complaint.js';
import { complaintCategories, complaintStatuses } from '../types/domain.js';
export async function getAnalytics(_req, res) {
    const [total, byStatus, byCategory, byCategoryStatus, unresolvedAging] = await Promise.all([
        ComplaintModel.countDocuments(),
        ComplaintModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ComplaintModel.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
        ComplaintModel.aggregate([{ $group: { _id: { category: '$category', status: '$status' }, count: { $sum: 1 } } }]),
        ComplaintModel.countDocuments({
            status: { $ne: 'resolved' },
            createdAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
    ]);
    const now = new Date();
    const [overdueFirstResponse, overdueResolution, nearingDeadline, responseTiming, resolutionTiming] = await Promise.all([
        ComplaintModel.countDocuments({ firstResponseAt: { $exists: false }, firstResponseDueAt: { $lt: now }, status: { $ne: 'resolved' } }),
        ComplaintModel.countDocuments({ status: { $ne: 'resolved' }, resolutionDueAt: { $lt: now } }),
        ComplaintModel.countDocuments({ status: { $ne: 'resolved' }, resolutionDueAt: { $gte: now, $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } }),
        ComplaintModel.aggregate([{ $match: { firstResponseAt: { $exists: true } } }, { $project: { hours: { $divide: [{ $subtract: ['$firstResponseAt', '$createdAt'] }, 3600000] } } }, { $group: { _id: null, averageHours: { $avg: '$hours' } } }]),
        ComplaintModel.aggregate([{ $match: { resolvedAt: { $exists: true } } }, { $project: { days: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 86400000] } } }, { $group: { _id: null, averageDays: { $avg: '$days' } } }]),
    ]);
    const statusCounts = Object.fromEntries(complaintStatuses.map((status) => [status, 0]));
    for (const row of byStatus)
        statusCounts[row._id] = row.count;
    const categoryCounts = Object.fromEntries(complaintCategories.map((category) => [category, 0]));
    for (const row of byCategory)
        categoryCounts[row._id] = row.count;
    const categoryStatusCounts = Object.fromEntries(complaintCategories.map(category => [category, { pending: 0, under_review: 0, resolved: 0 }]));
    for (const row of byCategoryStatus) {
        categoryStatusCounts[row._id.category][row._id.status] = row.count;
    }
    const resolved = statusCounts.resolved ?? 0;
    res.json({
        total,
        resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
        byStatus: statusCounts,
        byCategory: categoryCounts,
        byCategoryStatus: categoryStatusCounts,
        unresolvedAging,
        sla: {
            overdueFirstResponse,
            overdueResolution,
            nearingDeadline,
            averageResponseHours: Math.round(responseTiming[0]?.averageHours ?? 0),
            averageResolutionDays: Math.round((resolutionTiming[0]?.averageDays ?? 0) * 10) / 10,
        },
    });
}
