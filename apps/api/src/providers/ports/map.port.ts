import { MapSource, MapSourceSummary, MapMarker } from '../../contract/entities';

export type { MapSource, MapSourceSummary, MapMarker };

/**
 * 地图数据域端口：Service 只依赖此端口，不感知 JSON 存储与人工叠加合并细节。
 */
export interface MapPort {
  listSources(): Promise<MapSourceSummary[]>;
  getSource(sourceId: string): Promise<MapSource | null>;
}
