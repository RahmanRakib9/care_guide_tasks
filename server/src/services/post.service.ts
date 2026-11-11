import mongoose from 'mongoose';
import { Post, IPostDocument } from '../models/post.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { CreatePostInput } from '../validators/post.validator.js';

export const createPost = async (
  input: CreatePostInput & { userId: any }
): Promise<IPostDocument> => {
  const post = await Post.create({
    title: input.title,
    content: input.content,
    userId: input.userId
  });
  return post.populate('userId', 'name email role');
};

export const getPosts = async ({
  page,
  limit
}: {
  page: number;
  limit: number;
}): Promise<{ posts: any[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments()
  ]);

  return { posts, total };
};

/**
 * CRITICAL REQUIREMENT — AGGREGATION SCENARIO 2:
 * Retrieves a user and all posts belonging to that user using a SINGLE aggregation pipeline with $lookup.
 */
export const getUserPostsWithLookup = async (userId: string): Promise<any> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const result = await User.aggregate([
    {
      $match: {
        _id: userObjectId
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'userId',
        as: 'posts',
        pipeline: [
          {
            $sort: { createdAt: -1, _id: -1 }
          },
          {
            $project: {
              __v: 0
            }
          }
        ]
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        interests: 1,
        createdAt: 1,
        posts: 1,
        totalPosts: { $size: '$posts' }
      }
    }
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  return result[0];
};
