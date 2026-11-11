import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const app: Application = express();
let databaseConnection: ReturnType<typeof connectDB> | null = null;

app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', apiLimiter);
app.use('/api', async (_req, _res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (!databaseConnection) {
        databaseConnection = connectDB().catch((error: unknown) => {
          databaseConnection = null;
          throw error;
        });
      }
      await databaseConnection;
    }
    next();
  } catch (error) {
    next(error);
  }
});
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
