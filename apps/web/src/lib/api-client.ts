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
