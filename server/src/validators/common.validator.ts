import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format');

export const idParamSchema = z.object({
  id: objectIdSchema
});

export const userIdParamSchema = z.object({
  userId: objectIdSchema
});

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && parseInt(val, 10) > 0), {
      message: 'Page must be a positive integer'
    }),
  limit: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && parseInt(val, 10) > 0 && parseInt(val, 10) <= 100), {
      message: 'Limit must be an integer between 1 and 100'
    })
});
