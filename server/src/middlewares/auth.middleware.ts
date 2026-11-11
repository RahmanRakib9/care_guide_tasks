import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';

export interface JwtUserPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Authentication token missing or invalid format'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, 'Authentication token not provided'));
    }

    let decoded: JwtUserPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtUserPayload;
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token has expired, please log in again'));
      }
      return next(new ApiError(401, 'Invalid authentication token'));
    }

    if (!decoded || !decoded.id) {
      return next(new ApiError(401, 'Invalid token payload'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'User associated with this token no longer exists'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
