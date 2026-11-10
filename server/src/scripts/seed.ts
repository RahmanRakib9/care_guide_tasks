import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { Post } from '../models/post.model';
import { ROLES } from '../constants/roles';

export const seedDatabase = async (): Promise<void> => {
  console.log('[Seed] Cleaning up existing collection data for clean idempotent seed...');
  await Promise.all([
    User.deleteMany({}),
    Note.deleteMany({}),
    Post.deleteMany({})
  ]);

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  console.log('[Seed] Creating users...');
  const usersData = [
    {
      name: 'System Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: ROLES.ADMIN,
      interests: ['security', 'cloud', 'architecture', 'coding']
    },
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: hashedPassword,
      role: ROLES.USER,
      interests: ['coding', 'react', 'architecture', 'reading']
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: hashedPassword,
      role: ROLES.USER,
      interests: ['coding', 'cloud', 'devops']
    },
    {
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password: hashedPassword,
      role: ROLES.USER,
      interests: ['reading', 'design', 'security']
    }
  ];

  const createdUsers = await User.insertMany(usersData);
  const [admin, alice, bob, charlie] = createdUsers;

  console.log(`[Seed] Created ${createdUsers.length} users with overlapping interests.`);

  console.log('[Seed] Creating notes...');
  const notesData = [
    {
      title: 'React Architecture Best Practices',
      content: 'Keep state as local as possible. Use context for truly global state like auth.',
      userId: alice._id
    },
    {
      title: 'Meeting Notes: Sprint Planning',
      content: 'Agreed on implementing JWT authentication and MongoDB compound indexing for Q1.',
      userId: alice._id
    },
    {
      title: 'Personal Study Plan',
      content: 'Focus on distributed systems and MongoDB aggregation performance tuning.',
      userId: alice._id
    },
    {
      title: 'Docker Deployment Checklist',
      content: 'Check multi-stage builds, non-root user execution, and environment secret injection.',
      userId: bob._id
    },
    {
      title: 'Cloud Cost Optimization Ideas',
      content: 'Review idle MongoDB clusters and consolidate preview environments.',
      userId: bob._id
    },
    {
      title: 'Design System Typography Scale',
      content: 'Base font size 16px. Scale ratio 1.25 for headings. Line height 1.5 for body text.',
      userId: charlie._id
    },
    {
      title: 'Book Recommendations',
      content: 'Designing Data-Intensive Applications by Martin Kleppmann is essential reading.',
      userId: charlie._id
    },
    {
      title: 'Security Audit Q1',
      content: 'Verify rate limiting on auth endpoints and audit role-based access control rules.',
      userId: admin._id
    }
  ];

  const createdNotes = await Note.insertMany(notesData);
  console.log(`[Seed] Created ${createdNotes.length} notes across multiple users.`);

  console.log('[Seed] Creating posts...');
  const postsData = [
    {
      title: 'Getting Started with Clean Architecture in Express',
      content: 'Separating routes, controllers, services, and models makes testing much easier.',
      userId: alice._id
    },
    {
      title: 'Why MongoDB Indexes Matter for List Queries',
      content: 'Without compound indexes adhering to ESR, sorting paginated results causes memory spikes.',
      userId: alice._id
    },
    {
      title: 'Continuous Integration with GitHub Actions',
      content: 'Running automated tests on every push catches regressions before they reach production.',
      userId: bob._id
    },
    {
      title: 'Essential Books for Backend Engineers',
      content: 'A curated list of books covering databases, networking, and system design.',
      userId: charlie._id
    },
    {
      title: 'System Security Notice: Always Hash Passwords with Salt',
      content: 'Never store plain-text passwords and ensure bcrypt salt rounds are adequate.',
      userId: admin._id
    }
  ];

  const createdPosts = await Post.insertMany(postsData);
  console.log(`[Seed] Created ${createdPosts.length} posts across multiple users.`);

  console.log('\n========================================');
  console.log(' SEEDING COMPLETED SUCCESSFULLY');
  console.log('========================================');
  console.log('Available development accounts (Password: Password123!):');
  console.log('1. Admin:   admin@example.com   (Role: admin)');
  console.log('2. User 1:  alice@example.com   (Role: user)');
  console.log('3. User 2:  bob@example.com     (Role: user)');
  console.log('4. User 3:  charlie@example.com (Role: user)');
  console.log('========================================\n');
};

if (process.argv[1]?.replace(/\\/g, '/').includes('src/scripts/seed')) {
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
