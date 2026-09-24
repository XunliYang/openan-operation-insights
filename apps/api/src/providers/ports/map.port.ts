import { MapSource, MapSourceSummary, MapMarker, ParticipantCategory } from '../../contract/entities';

export type { MapSource, MapSourceSummary, MapMarker };

/**
 * 写接口入参：不含 `origin` 与 `sourceId`（均由合并/存储逻辑写入，不采信请求声明）。
 * 字段语义与 `UpsertMapMarkerDto` 对齐（校验在 Controller/DTO 层完成）。
 */
export interface ManualMarkerInput {
  markerId: string;
  label: string;
  /** 缺省时归一化为空串（空串 = 前端降级为字母色块） */
  logoUrl?: string;
  homepageUrl?: string;
  countryCode: string;
  countryName: string;
  longitude: number;
  latitude: number;
  locationLabel?: string;
  /** 缺省时归一化为 'other' */
  category?: ParticipantCategory;
  description?: string;
  orgId?: string | null;
}

/**
 * 地图数据域端口：Service 只依赖此端口，不感知 JSON 存储与人工叠加合并细节。
 */
export interface MapPort {
  listSources(): Promise<MapSourceSummary[]>;
  getSource(sourceId: string): Promise<MapSource | null>;
  /** 写人工层（同 markerId 覆盖内置或人工），返回合并后的完整 source；sourceId 不存在时返回 null */
  upsertManualMarker(sourceId: string, marker: ManualMarkerInput): Promise<MapSource | null>;
  /** 只删人工层条目；内置 seed 不可删（返回 null 由 Service 映射为 40400） */
  deleteManualMarker(sourceId: string, markerId: string): Promise<MapSource | null>;
  /** 写能力是否已启用（MAP_WRITE_TOKEN 已配置） */
  isWritable(): boolean;
}
