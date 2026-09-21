import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ErrorCode,
  ERROR_DEFAULT_MESSAGE,
  ERROR_HTTP_STATUS,
} from '../constants/error-code';
import { DomainException } from '../exceptions/domain.exception';

interface ErrorBody {
  code: number;
  message: string;
  data: null;
}

/** 将 ValidationPipe 抛出的消息数组拼接为一句可读文案 */
function flattenMessages(response: unknown): string | null {
  if (typeof response === 'string') return response;
  if (typeof response !== 'object' || response === null) return null;

  const payload = response as { message?: unknown; error?: unknown };
  if (Array.isArray(payload.message)) {
    return payload.message.map((item) => String(item)).join('；');
  }
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.error === 'string') return payload.error;
  return null;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toErrorBody(exception);
    const status = this.resolveStatus(exception, body.code);

    if (body.code === ErrorCode.INTERNAL_ERROR) {
      // 未预期异常：服务端记录完整堆栈，对外不泄漏
      this.logger.error(
        `${request.method} ${request.url} → ${status} (${body.code}) ${body.message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${status} (${body.code}) ${body.message}`);
    }

    response.status(status).json(body);
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof DomainException) {
      return { code: exception.code, message: exception.message, data: null };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = flattenMessages(exception.getResponse()) ?? exception.message;
      return { code: this.mapHttpStatus(status), message, data: null };
    }

    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: ERROR_DEFAULT_MESSAGE[ErrorCode.INTERNAL_ERROR],
      data: null,
    };
  }

  private resolveStatus(exception: unknown, code: number): number {
    if (exception instanceof DomainException) return exception.httpStatus;
    if (exception instanceof HttpException) return exception.getStatus();
    const mapped = (Object.values(ErrorCode) as number[]).includes(code)
      ? ERROR_HTTP_STATUS[code as ErrorCode]
      : HttpStatus.INTERNAL_SERVER_ERROR;
    return mapped ?? HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private mapHttpStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ErrorCode.UPSTREAM_UNAVAILABLE;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.UPSTREAM_RATE_LIMITED;
      default:
        return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
    }
  }
}
