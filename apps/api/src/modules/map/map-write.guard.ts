import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { ErrorCode } from '../../common/constants/error-code';
import { DomainException } from '../../common/exceptions/domain.exception';

/**
 * 地图人工层写接口鉴权（ADR-0008）：
 * - `MAP_WRITE_TOKEN` 未配置 → 40301 WRITE_DISABLED（默认只读，这是有意的）；
 * - 已配置但请求头 `X-Admin-Token` 缺失/不匹配 → 40300 FORBIDDEN（timingSafeEqual 比较）。
 */
@Injectable()
export class MapWriteGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configured = this.config.get<string>('mapWriteToken') ?? '';
    if (!configured) {
      throw new DomainException(ErrorCode.WRITE_DISABLED);
    }

    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const provided = request.headers['x-admin-token'];
    const providedStr = typeof provided === 'string' ? provided : '';

    if (!providedStr || !safeEqual(providedStr, configured)) {
      throw new DomainException(ErrorCode.FORBIDDEN);
    }
    return true;
  }
}

/** 长度相等后用 timingSafeEqual 比较，避免时序侧信道。 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}