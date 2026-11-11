import React from 'react';
import { PaginationMeta } from '../types';

export interface PaginationProps {
  pagination: PaginationMeta | null;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div className="pagination">
      <span>
        Page {page} of {totalPages} ({total} total posts)
      </span>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
