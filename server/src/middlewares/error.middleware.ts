import { Request, Response, NextFunction } from 'express';
import { ApiError, FormattedError } from '../utils/apiError.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Route not found`));
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    error = new ApiError(400, `Invalid ID format for parameter: ${err.path}`);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new ApiError(409, `An account with this ${field} already exists`);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const formattedErrors: FormattedError[] = Object.values(err.errors).map((val: any) => ({
      field: val.path,
      message: val.message
    }));
    error = new ApiError(400, 'Database validation failed', formattedErrors);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  const response: Record<string, any> = {
    success: false,
    message,
    errors
  };

  if (config.nodeEnv === 'development' && !error.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
