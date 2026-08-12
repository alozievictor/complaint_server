import { connectDatabase } from './connect.js';
import { AdminModel } from '../models/Admin.js';
await connectDatabase();
const duplicates = await AdminModel.aggregate([
    { $group: { _id: '$email', count: { $sum: 1 }, adminIds: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
]);
if (duplicates.length > 0) {
    console.error('Cannot create the unique admin email index because duplicate emails exist:', duplicates);
    process.exit(1);
}
await AdminModel.collection.createIndex({ email: 1 }, { name: 'admin_email_unique', unique: true });
console.log('Unique admin email index is ready.');
process.exit(0);
