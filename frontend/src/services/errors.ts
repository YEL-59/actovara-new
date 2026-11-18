/** Normalised API error (mirrors the backend globalErrorHandler envelope, PRD §7). */
export interface ErrorSource {
  path: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorSources: ErrorSource[];

  constructor(statusCode: number, message: string, errorSources: ErrorSource[] = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorSources = errorSources;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** User-facing message for any thrown value. */
export function errorMessage(e: unknown): string {
  if (isApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}
