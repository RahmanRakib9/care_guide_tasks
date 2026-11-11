import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendResponse } from '../utils/apiResponse';
import { getPaginationParams, formatPaginationMeta } from '../utils/pagination';

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.createUser(req.body);
    sendResponse(res, 201, 'User created successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const { users, total } = await userService.getUsers({ page, limit });
    const pagination = formatPaginationMeta(total, page, limit);
    sendResponse(res, 200, 'Users retrieved successfully', { users }, pagination);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.getUserById(id);
    sendResponse(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.updateUser({
      id,
      updateData: req.body
    });
    sendResponse(res, 200, 'User updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await userService.deleteUser({
      id,
      currentAdminUser: req.user!
    });
    sendResponse(res, 200, 'User deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getInterestsGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const { groups, total } = await userService.getUsersGroupedByInterests({ page, limit });
    const pagination = formatPaginationMeta(total, page, limit);
    sendResponse(
      res,
      200,
      'Users grouped by interests retrieved successfully',
      { groups },
      pagination
    );
  } catch (error) {
    next(error);
  }
};
