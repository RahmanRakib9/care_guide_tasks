// Seed script: creates a single admin user from .env values.
import path from 'node:path';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/user.model';
import { ROLES } from '../constants/roles';

export const seedDatabase = async (): Promise<void> => {
  const adminName = process.env.ADMIN_NAME || 'Admin';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const adminPasswordPlain = process.env.ADMIN_PASSWORD || 'Password123!';

  const existingAdmin = await User.findOne({ email: adminEmail }).select('+password');
  if (existingAdmin) {
    existingAdmin.name = adminName;
    existingAdmin.password = adminPasswordPlain;
    existingAdmin.role = ROLES.ADMIN;
    existingAdmin.interests = [];
    await existingAdmin.save();
    console.log('[Seed] Admin user updated:', adminEmail);
    return;
  }

  await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPasswordPlain,
    role: ROLES.ADMIN,
    interests: []
  });
  console.log('[Seed] Admin user created:', adminEmail);
};

if (path.basename(process.argv[1] || '').startsWith('seed.')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err: any) {
      console.error(`[Seed Error] Failed: ${err.message}`);
      await disconnectDB();
      process.exit(1);
    }
  })();
}
