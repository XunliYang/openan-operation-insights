import { ErrorCode, ERROR_DEFAULT_MESSAGE, ERROR_HTTP_STATUS } from '../constants/error-code';

/** 业务领域异常：携带 ErrorCode，由 AllExceptionsFilter 统一转换 */
export class DomainException extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? ERROR_DEFAULT_MESSAGE[code]);
    this.name = 'DomainException';
    this.code = code;
    this.httpStatus = ERROR_HTTP_STATUS[code];
    Error.captureStackTrace?.(this, DomainException);
  }
}
