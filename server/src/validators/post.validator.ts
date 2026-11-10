import { z } from 'zod';

export const createPostSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(1, 'Content cannot be empty')
    .max(5000, 'Content cannot exceed 5000 characters')
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
