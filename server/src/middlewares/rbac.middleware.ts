import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'User is not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'Forbidden: You do not have permission to perform this action')
      );
    }

    next();
  };
};
