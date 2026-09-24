import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * 把响应 `Cache-Control` 显式覆盖为 `no-store`。
 *
 * 全局 `ResponseInterceptor` 对所有响应设了 `Cache-Control: private, max-age=60`，
 * 而方法级拦截器（本拦截器）的 `intercept()` 在全局拦截器之后执行（Nest 拦截器链
 * 全局 → 控制器 → 方法级依次包裹），因此此处 setHeader 会覆盖全局默认值。
 * 写接口的响应必须 no-store，否则浏览器会把写后的 GET 缓存住（过时旧数据）。
 */
@Injectable()
export class CacheNoStoreInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context
      .switchToHttp()
      .getResponse<{ setHeader(name: string, value: string): void }>();
    response.setHeader('Cache-Control', 'no-store');
    return next.handle();
  }
}
