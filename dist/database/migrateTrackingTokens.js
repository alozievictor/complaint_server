import { randomUUID } from 'node:crypto';
import { connectDatabase } from './connect.js';
import { ComplaintModel } from '../models/Complaint.js';
await connectDatabase();
const complaints = await ComplaintModel.find({
    $or: [
        { trackingToken: { $exists: false } },
        { trackingToken: null },
        { trackingToken: '' },
    ],
}).select('_id');
if (complaints.length > 0) {
    await ComplaintModel.bulkWrite(complaints.map((complaint) => ({
        updateOne: {
            filter: { _id: complaint._id },
            update: { $set: { trackingToken: randomUUID().toUpperCase() } },
        },
    })));
}
console.log(`Added private tracking tokens to ${complaints.length} complaint(s).`);
process.exit(0);
