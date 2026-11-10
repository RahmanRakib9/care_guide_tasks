export interface FormattedError {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  statusCode: number;
  errors: FormattedError[];
  isOperational: boolean;

  constructor(statusCode: number, message: string, errors: FormattedError[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
