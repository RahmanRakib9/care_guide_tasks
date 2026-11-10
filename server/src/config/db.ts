import mongoose, { Mongoose } from 'mongoose';
import { config } from './env';

let memoryServerInstance: any = null;

export const connectDB = async (customUri?: string): Promise<Mongoose> => {
  const uri = customUri || config.mongodbUri;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    // If in development or test mode and unable to reach local daemon, fallback to MongoMemoryServer
    if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
      console.warn(`[Database] Local MongoDB at ${uri} not reachable (${error.message}).`);
      console.log('[Database] Starting isolated development database...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create();
        const memoryUri = memoryServerInstance.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[Database] Connected to Development Database instance at: ${memoryUri}`);
        return conn;
      } catch (fallbackError: any) {
        console.error(`[Database Error] Fallback memory server failed: ${fallbackError.message}`);
        throw error;
      }
    }
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    console.log('[Database] MongoDB disconnected cleanly');
  } catch (error: any) {
    console.error(`[Database Error] Disconnection error: ${error.message}`);
  }
};
