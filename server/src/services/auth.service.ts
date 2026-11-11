import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUserDocument } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { config } from '../config/env.js';
import { ROLES } from '../constants/roles.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export const generateToken = (user: IUserDocument): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any
  };

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role
    },
    config.jwtSecret,
    options
  );
};

export const registerUser = async (
  input: RegisterInput
): Promise<{ user: IUserDocument; token: string }> => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const formattedInterests = Array.isArray(input.interests)
    ? [...new Set(input.interests.map((i) => i.trim().toLowerCase()).filter(Boolean))]
    : [];

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    role: ROLES.USER,
    interests: formattedInterests
  });

  const token = generateToken(user);
  return { user, token };
};

export const loginUser = async (
  input: LoginInput
): Promise<{ user: IUserDocument; token: string }> => {
  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(input.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user);
  return { user, token };
};

export const getCurrentUser = async (userId: string | any): Promise<IUserDocument> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }
  return user;
};
