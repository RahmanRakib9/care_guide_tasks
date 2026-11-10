import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { config } from './config/env';
import { User } from './models/user.model';
import { seedDatabase } from './scripts/seed';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    if (config.nodeEnv === 'development') {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Server] Empty database detected. Seeding initial development accounts...');
        await seedDatabase();
      }
    }

    const server = app.listen(config.port, () => {
      console.log(`[Server] Secure Notes API running on port ${config.port} in ${config.nodeEnv} mode`);
      console.log(`[Server] Health check available at: http://localhost:${config.port}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Process terminated cleanly');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error: any) {
    console.error(`[Server Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
