import bcrypt from 'bcryptjs';
import { User, IUserDocument } from '../models/user.model';
import { Note } from '../models/note.model';
import { Post } from '../models/post.model';
import { ApiError } from '../utils/apiError';
import { ROLES, UserRole } from '../constants/roles';
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator';

export const createUser = async (input: CreateUserInput): Promise<IUserDocument> => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const formattedInterests = Array.isArray(input.interests)
    ? [...new Set(input.interests.map((i) => i.trim().toLowerCase()).filter(Boolean))]
    : [];

  return User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    role: (input.role as UserRole) || ROLES.USER,
    interests: formattedInterests
  });
};

export const getUsers = async ({
  page,
  limit
}: {
  page: number;
  limit: number;
}): Promise<{ users: any[]; total: number }> => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find()
      .select('-__v')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments()
  ]);

  return { users, total };
};

export const getUserById = async (id: string): Promise<IUserDocument> => {
  const user = await User.findById(id).select('-__v');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const updateUser = async ({
  id,
  updateData,
  currentAdminUser
}: {
  id: string;
  updateData: UpdateUserInput;
  currentAdminUser: IUserDocument;
}): Promise<IUserDocument> => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Security Rule 1: Prevent self-demotion
  if (
    currentAdminUser._id.toString() === user._id.toString() &&
    updateData.role !== undefined &&
    updateData.role !== ROLES.ADMIN
  ) {
    throw new ApiError(400, 'Administrators cannot demote their own account');
  }

  // Security Rule 2: Prevent demoting the last administrator
  if (
    user.role === ROLES.ADMIN &&
    updateData.role !== undefined &&
    updateData.role !== ROLES.ADMIN
  ) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot demote the last administrator in the system');
    }
  }

  // Check email uniqueness if email is changed
  if (updateData.email && updateData.email !== user.email) {
    const emailExists = await User.findOne({ email: updateData.email });
    if (emailExists) {
      throw new ApiError(409, 'An account with this email already exists');
    }
    user.email = updateData.email;
  }

  if (updateData.name !== undefined) user.name = updateData.name;
  if (updateData.role !== undefined) user.role = updateData.role as UserRole;
  if (updateData.interests !== undefined) {
    user.interests = Array.isArray(updateData.interests)
      ? [...new Set(updateData.interests.map((i) => i.trim().toLowerCase()).filter(Boolean))]
      : [];
  }

  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(updateData.password, salt);
  }

  await user.save();
  return user;
};

export const deleteUser = async ({
  id,
  currentAdminUser
}: {
  id: string;
  currentAdminUser: IUserDocument;
}): Promise<{ id: string; deleted: boolean }> => {
  if (currentAdminUser._id.toString() === id.toString()) {
    throw new ApiError(400, 'Administrators cannot delete their own account');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot delete the last administrator in the system');
    }
  }

  await user.deleteOne();

  await Promise.all([
    Note.deleteMany({ userId: id }),
    Post.deleteMany({ userId: id })
  ]);

  return { id, deleted: true };
};

/**
 * CRITICAL REQUIREMENT — AGGREGATION SCENARIO 1:
 * Groups users by their interests array using EXACTLY ONE collection.aggregate() call.
 */
export const getUsersGroupedByInterests = async ({
  page = 1,
  limit = 10
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{ groups: any[]; total: number }> => {
  const skip = (page - 1) * limit;

  const result = await User.aggregate([
    {
      $match: {
        interests: { $exists: true, $type: 'array', $ne: [] }
      }
    },
    {
      $unwind: '$interests'
    },
    {
      $addFields: {
        interestClean: { $trim: { input: '$interests' } }
      }
    },
    {
      $match: {
        interestClean: { $ne: '' }
      }
    },
    {
      $group: {
        _id: '$interestClean',
        users: {
          $push: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            role: '$role',
            createdAt: '$createdAt'
          }
        },
        totalUsers: { $sum: 1 }
      }
    },
    {
      $sort: {
        totalUsers: -1,
        _id: 1
      }
    },
    {
      $project: {
        _id: 1,
        interest: '$_id',
        users: 1,
        totalUsers: 1
      }
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }]
      }
    }
  ]);

  const data = result[0]?.data || [];
  const total = result[0]?.totalCount[0]?.count || 0;

  return {
    groups: data,
    total
  };
};
