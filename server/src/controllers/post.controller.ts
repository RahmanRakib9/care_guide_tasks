import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/post.service.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getPaginationParams, formatPaginationMeta } from '../utils/pagination.js';

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const post = await postService.createPost({
      title: req.body.title,
      content: req.body.content,
      userId: req.user!._id
    });
    sendResponse(res, 201, 'Post created successfully', { post });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const { posts, total } = await postService.getPosts({ page, limit });
    const pagination = formatPaginationMeta(total, page, limit);
    sendResponse(res, 200, 'Posts retrieved successfully', { posts }, pagination);
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const userWithPosts = await postService.getUserPostsWithLookup(userId);
    sendResponse(
      res,
      200,
      'User posts retrieved successfully via $lookup aggregation',
      { user: userWithPosts }
    );
  } catch (error) {
    next(error);
  }
};
