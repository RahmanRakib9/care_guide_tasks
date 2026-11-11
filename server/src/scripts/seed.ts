// Seed script: creates a single admin user from .env values.
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/user.model';
import { ROLES } from '../constants/roles';
import dotenv from 'dotenv';

dotenv.config(); // load ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD

export const seedDatabase = async (): Promise<void> => {
  console.log('[Seed] Cleaning up existing users for idempotent admin seed...');
  await User.deleteMany({});

  const adminName = process.env.ADMIN_NAME || 'Admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPasswordPlain = process.env.ADMIN_PASSWORD || 'Password123!';

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPasswordPlain, salt);

  const adminUser = new User({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: ROLES.ADMIN,
    interests: []
  });

  await adminUser.save();
  console.log('[Seed] Admin user created:', adminEmail);
};

if (process.argv[1]?.replace(/\\\\/g, '/').includes('src/scripts/seed')) {
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
