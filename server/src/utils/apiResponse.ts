import { Response } from 'express';
import { PaginationMeta } from './pagination';

export interface ApiResponsePayload<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
}

export const sendResponse = <T = any>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  pagination: PaginationMeta | null = null
): Response => {
  const response: ApiResponsePayload<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (pagination !== null) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};
