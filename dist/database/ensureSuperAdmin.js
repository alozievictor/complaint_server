import bcrypt from 'bcryptjs';
import { connectDatabase } from './connect.js';
import { AdminModel } from '../models/Admin.js';
const passwordHash = await bcrypt.hash('admin12345', 12);
await connectDatabase();
const admin = await AdminModel.findOneAndUpdate({ username: 'superadmin' }, {
    $set: {
        name: 'Dr. Owusu',
        username: 'superadmin',
        email: 'admin@lincoln.edu.gh',
        passwordHash,
        role: 'super',
        isActive: true,
    },
}, { new: true, upsert: true });
console.log(`Default Super Admin ready: ${admin.username} / admin@lincoln.edu.gh`);
process.exit(0);
