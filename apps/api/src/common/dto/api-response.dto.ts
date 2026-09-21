/** 统一响应信封（见 03 文档 6.2） */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 标记"已被拦截器包装"，避免重复包装 */
export const WRAPPED_RESPONSE = Symbol('WRAPPED_RESPONSE');

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WrappedPayload<T> {
  [WRAPPED_RESPONSE]: true;
  payload: ApiResponse<T>;
}

export function isWrapped(value: unknown): value is WrappedPayload<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[WRAPPED_RESPONSE] === true
  );
}
