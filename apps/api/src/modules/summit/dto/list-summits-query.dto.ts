import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ToBoolean } from '../../../common/dto/transforms';

export class ListSummitsQueryDto {
  /**
   * 仅校验整数类型；2000–2100 的区间由 SummitService.assertYear 判定并返回 40003，
   * 避免越界被 DTO 抢先归一成 40001（见 04 文档峰会接口参数表）。
   */
  @IsOptional()
  @IsInt()
  year?: number;

  /** 默认 false：仅返回摘要字段 */
  @IsOptional()
  @ToBoolean()
  includeDetail?: boolean;

  @IsOptional()
  @ToBoolean()
  upcomingOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
