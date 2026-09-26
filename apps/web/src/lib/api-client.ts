import type { ApiResponse } from '@/types/contract';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export class ApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isDataCorrupted(): boolean {
    return this.code === 50001;
  }
}

type QueryValue = string | number | boolean | undefined | null | Array<string | number>;

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export interface RequestOptions {
  params?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

/**
 * 统一 GET：拆信封 + 错误码归一。
 * 非 0 code 一律抛 ApiError，由 react-query 的 error 分支统一处理。
 */
export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path}${buildQuery(options.params)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(-1, '无法连接后端服务，请确认 API 已启动', 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(-2, `响应不是合法 JSON（HTTP ${response.status}）`, response.status);
  }

  if (!payload || typeof payload.code !== 'number') {
    throw new ApiError(-2, '响应格式不符合统一信封约定', response.status);
  }

  if (payload.code !== 0) {
    throw new ApiError(payload.code, payload.message || '请求失败', response.status);
  }

  return payload.data;
}

/** 管理员令牌的 sessionStorage 键（令牌只存这里，绝不进 URL / 日志 / 交付物） */
const ADMIN_TOKEN_KEY = 'openan.map.adminToken';

export type HttpMethod = 'POST' | 'PUT' | 'DELETE';

/** 读取管理员令牌（无则返回 null） */
export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

/** 写入管理员令牌；空值即清除 */
export function setAdminToken(token: string): void {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * 统一写请求（POST/PUT/DELETE）：与 apiGet 同一套信封拆解 + ApiError 归一。
 * - 有管理员令牌时附 `X-Admin-Token` 头（读 sessionStorage，不进 URL）；
 * - `body` 非 undefined 时序列化为 JSON 并附 `Content-Type`。
 */
export async function apiSend<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${BASE_URL}${path}${buildQuery(options.params)}`;
  const headers: Record<string, string> = { Accept: 'application/json' };

  const token = getAdminToken();
  if (token) headers['X-Admin-Token'] = token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(-1, '无法连接后端服务，请确认 API 已启动', 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(-2, `响应不是合法 JSON（HTTP ${response.status}）`, response.status);
  }

  if (!payload || typeof payload.code !== 'number') {
    throw new ApiError(-2, '响应格式不符合统一信封约定', response.status);
  }

  if (payload.code !== 0) {
    throw new ApiError(payload.code, payload.message || '请求失败', response.status);
  }

  return payload.data;
}
