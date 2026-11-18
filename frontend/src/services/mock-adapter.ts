/**
 * Turns a mock handler into a realistic API call:
 * - simulated network latency
 * - the `sendResponse` envelope `{ success, statusCode, message, meta?, data }`
 * - `?mockState=loading|empty|error` in the page URL forces a UI state on read calls (PRD §8.5)
 * - thrown ApiErrors (403 / 404 / 409 …) mirror the backend globalErrorHandler
 */
import type { ApiEnvelope } from '@/types/domain';
import { ApiError } from './errors';

export type MockState = 'loading' | 'empty' | 'error' | null;

export function currentMockState(): MockState {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('mockState');
  return v === 'loading' || v === 'empty' || v === 'error' ? v : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = (kind: 'read' | 'write') => (kind === 'read' ? 250 + Math.random() * 350 : 400 + Math.random() * 400);

export interface MockResult<T> {
  data: T;
  message?: string;
  statusCode?: number;
  meta?: ApiEnvelope<T>['meta'];
}

interface MockOptions<T> {
  kind?: 'read' | 'write';
  /** Value returned for `?mockState=empty` (list endpoints). */
  empty?: () => T;
}

export async function mockCall<T>(handler: () => MockResult<T>, { kind = 'read', empty }: MockOptions<T> = {}): Promise<ApiEnvelope<T>> {
  const state = kind === 'read' ? currentMockState() : null;
  if (state === 'loading') return new Promise<never>(() => undefined); // never resolves → skeletons stay visible
  await sleep(latency(kind));
  if (state === 'error') throw new ApiError(500, 'The server could not be reached (simulated by ?mockState=error).');
  if (state === 'empty' && empty) {
    const data = empty();
    return { success: true, statusCode: 200, message: 'OK', data, meta: Array.isArray(data) ? { page: 1, limit: 20, total: 0, totalPage: 0 } : undefined };
  }
  const res = handler(); // may throw ApiError
  // Deep-copy so screens can never mutate the store by accident.
  const data = structuredClone(res.data);
  return { success: true, statusCode: res.statusCode ?? (kind === 'write' ? 201 : 200), message: res.message ?? 'OK', meta: res.meta, data };
}

/** Slice + meta for paginated list endpoints. */
export function paginate<T>(items: T[], page = 1, limit = 20): MockResult<T[]> {
  const total = items.length;
  const totalPage = Math.max(1, Math.ceil(total / limit));
  const p = Math.min(Math.max(1, page), totalPage);
  return { data: items.slice((p - 1) * limit, p * limit), meta: { page: p, limit, total, totalPage } };
}

export function notFound(entity: string): never {
  throw new ApiError(404, `${entity} not found`);
}

export function forbidden(message = 'You do not have permission to do that.'): never {
  throw new ApiError(403, message);
}

export function invalid(message: string, path?: string): never {
  throw new ApiError(400, message, path ? [{ path, message }] : []);
}

export function conflict(message: string): never {
  throw new ApiError(409, message);
}
