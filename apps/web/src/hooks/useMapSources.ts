import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { queryKeys } from './query-keys';
import type { MapSource, MapSourceSummary } from '@/types/contract';

const FIVE_MINUTES = 5 * 60 * 1000;
/** 与后端人工层 cacheTtlMs（15s）对齐，保证人工叠加「改了能看到」 */
const MANUAL_REFRESH_MS = 15 * 1000;

/** 地图 source 列表（含 markerCount），供 source 切换器使用 */
export function useMapSources() {
  return useQuery({
    queryKey: queryKeys.mapSources(),
    queryFn: ({ signal }) => apiGet<MapSourceSummary[]>('/maps', { signal }),
    staleTime: FIVE_MINUTES,
  });
}

/** 单个 source 的完整数据（markers），staleTime 取人工层 TTL，挂载时强制刷新一次 */
export function useMapSource(sourceId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.mapSource(sourceId ?? ''),
    queryFn: ({ signal }) => apiGet<MapSource>(`/maps/${encodeURIComponent(sourceId ?? '')}`, { signal }),
    enabled: Boolean(sourceId),
    staleTime: MANUAL_REFRESH_MS,
    refetchOnMount: true,
  });
}
