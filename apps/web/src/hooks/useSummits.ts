import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { queryKeys } from './query-keys';
import type { SummitDetail, SummitSummary, Paginated } from '@/types/contract';

export type SummitRow = SummitSummary | SummitDetail;

export function isSummitDetail(row: SummitRow): row is SummitDetail {
  return (row as SummitDetail).attendingOrganizations !== undefined;
}

export interface UseSummitsOptions {
  year?: number;
  includeDetail?: boolean;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useSummits(options: UseSummitsOptions = {}) {
  const { year, includeDetail = false, page = 1, pageSize = 20, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.summits(year, includeDetail, page, pageSize),
    queryFn: ({ signal }) =>
      apiGet<Paginated<SummitRow>>('/summits', {
        params: { year, includeDetail, page, pageSize },
        signal,
      }),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useSummitDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.summitDetail(id ?? ''),
    queryFn: ({ signal }) => apiGet<SummitDetail>(`/summits/${encodeURIComponent(id!)}`, { signal }),
    enabled: Boolean(id),
  });
}
