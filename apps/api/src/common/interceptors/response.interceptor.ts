import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, isWrapped } from '../dto/api-response.dto';

/**
 * 统一响应信封包装：{ code: 0, message: 'ok', data }。
 * 已是包装结构（isWrapped）时原样透出，避免重复包装。
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    const response = context.switchToHttp().getResponse<{ setHeader(name: string, value: string): void }>();
    response.setHeader('Cache-Control', 'private, max-age=60');

    return next.handle().pipe(
      map((data) => {
        if (isWrapped(data)) {
          return data.payload as unknown as ApiResponse<T>;
        }
        return { code: 0, message: 'ok', data } satisfies ApiResponse<T>;
      }),
    );
  }
}
