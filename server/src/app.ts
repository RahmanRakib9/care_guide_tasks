import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index';
import { apiLimiter } from './middlewares/rateLimit.middleware';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';
import { config } from './config/env';

const app: Application = express();

app.use(helmet());

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
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
