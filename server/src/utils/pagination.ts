export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getPaginationParams = (
  query: Record<string, any>,
  defaultLimit = 10,
  maxLimit = 100
): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  let limit = parseInt(query.limit as string, 10) || defaultLimit;

  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit) || 0;
  return {
    page,
    limit,
    total,
    totalPages
  };
};
