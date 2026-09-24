import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ParticipantCategory } from '../../../contract/entities';
import { ToTrimmedString } from '../../../common/dto/transforms';

export const PARTICIPANT_CATEGORIES: readonly ParticipantCategory[] = [
  'operator',
  'equipment-vendor',
  'integrator',
  'it-vendor',
  'cloud-vendor',
  'research',
  'other',
] as const;

/**
 * 写接口共用请求体（POST / PUT）。
 *
 * - `markerId`：仅 POST 在请求体提供（必填，controller 校验）；PUT 从路径取，
 *   请求体出现即拒绝（controller 显式 40001）。
 * - 校验口径与 `MapMarker` / `ManualMarkerInput` 对齐；全局 `whitelist + forbidNonWhitelisted`
 *   已保证 `origin` / `sourceId` 等未声明字段出现在请求体时被 40001 拒绝（不采信）。
 */
export class UpsertMapMarkerDto {
  /** 仅 POST 必填；kebab-case：小写字母/数字开头，其后为小写字母/数字/连字符，1–64 位 */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,63}$/)
  markerId?: string;

  @IsString()
  @Length(1, 80)
  @ToTrimmedString()
  label!: string;

  /** 可选；空串允许（前端降级为字母色块）；否则必须 http(s):// 或 / 开头（站内 public 相对路径） */
  @IsOptional()
  @IsString()
  @ValidateIf((_object, value) => value !== '')
  @Matches(/^(?:https?:\/\/|\/)/)
  logoUrl?: string;

  /** 可选；只允许 http(s)://（不接受 javascript: 等其它 scheme） */
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\//)
  homepageUrl?: string;

  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode!: string;

  @IsString()
  @Length(1, 64)
  @ToTrimmedString()
  countryName!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  locationLabel?: string;

  /** 缺省时归一化为 'other' */
  @IsOptional()
  @IsIn(PARTICIPANT_CATEGORIES)
  category?: ParticipantCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  orgId?: string | null;
}
