import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiSend } from '@/lib/api-client';
import { queryKeys } from './query-keys';
import type {
  MapCapabilities,
  MapSource,
  MapSourceSummary,
  UpsertMarkerBody,
} from '@/types/contract';

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

/** 写能力查询：是否启用编辑（后端 MAP_WRITE_TOKEN 已配置） */
export function useMapCapabilities() {
  return useQuery({
    queryKey: queryKeys.mapCapabilities(),
    queryFn: ({ signal }) => apiGet<MapCapabilities>('/maps/capabilities', { signal }),
    staleTime: FIVE_MINUTES,
  });
}

export interface UpsertMapMarkerVariables {
  sourceId: string;
  markerId: string;
  body: UpsertMarkerBody;
  /** true → PUT 覆盖（内置种子/已有条目）；false → POST 新增自定义条目 */
  isUpdate: boolean;
}

/** 新增 / 覆盖参与方 marker；成功后失效整棵 ['maps'] 缓存（列表 + 详情 + capabilities） */
export function useUpsertMapMarker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, markerId, body, isUpdate }: UpsertMapMarkerVariables) =>
      isUpdate
        ? apiSend<MapSource>(
            'PUT',
            `/maps/${encodeURIComponent(sourceId)}/markers/${encodeURIComponent(markerId)}`,
            body,
          )
        : apiSend<MapSource>('POST', `/maps/${encodeURIComponent(sourceId)}/markers`, {
            ...body,
            markerId,
          }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['maps'] });
    },
  });
}

/** 删除人工层 marker（内置种子不可删）；成功后失效整棵 ['maps'] 缓存 */
export function useDeleteMapMarker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, markerId }: { sourceId: string; markerId: string }) =>
      apiSend<MapSource>(
        'DELETE',
        `/maps/${encodeURIComponent(sourceId)}/markers/${encodeURIComponent(markerId)}`,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['maps'] });
    },
  });
}