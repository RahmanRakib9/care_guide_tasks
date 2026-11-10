import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendResponse } from '../utils/apiResponse';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, token } = await authService.registerUser(req.body);
    sendResponse(res, 201, 'User registered successfully', { user, token });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, token } = await authService.loginUser(req.body);
    sendResponse(res, 200, 'Login successful', { user, token });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getCurrentUser(req.user!._id);
    sendResponse(res, 200, 'User profile retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};
