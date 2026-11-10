import { z } from 'zod';
import { ROLE_VALUES } from '../constants/roles';

export const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  role: z.enum(ROLE_VALUES as [string, ...string[]]).optional(),
  interests: z.array(z.string().trim().min(1)).optional().default([])
});

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .optional(),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .toLowerCase()
      .optional(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password cannot exceed 100 characters')
      .optional(),
    role: z.enum(ROLE_VALUES as [string, ...string[]]).optional(),
    interests: z.array(z.string().trim().min(1)).optional()
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.password !== undefined ||
      data.role !== undefined ||
      data.interests !== undefined,
    {
      message: 'At least one field must be provided for update'
    }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
