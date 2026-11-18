/**
 * Real HTTP client for Phase B (used when NEXT_PUBLIC_USE_MOCKS=false).
 * Auth is an httpOnly session cookie (PRD §7), so no token is kept in localStorage.
 * The CSRF header for mutations is added in TASK-018/027.
 */
import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiEnvelope } from '@/types/domain';
import { API_URL } from './config';
import { ApiError, type ErrorSource } from './errors';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const body = error.response?.data as { message?: string; errorSources?: ErrorSource[] } | undefined;
    return Promise.reject(
      new ApiError(error.response?.status ?? 0, body?.message || error.message || 'Something went wrong', body?.errorSources ?? []),
    );
  },
);

async function call<T>(config: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
  const res = await api.request<ApiEnvelope<T>>(config);
  return res.data;
}

export const http = {
  get: <T>(url: string, params?: object) => call<T>({ method: 'GET', url, params }),
  post: <T>(url: string, data?: unknown) => call<T>({ method: 'POST', url, data }),
  patch: <T>(url: string, data?: unknown) => call<T>({ method: 'PATCH', url, data }),
  delete: <T>(url: string) => call<T>({ method: 'DELETE', url }),
  /** multipart/form-data upload */
  upload: <T>(url: string, form: FormData) => call<T>({ method: 'POST', url, data: form, headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default api;
