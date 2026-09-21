import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { queryKeys } from './query-keys';
import type { HomeSummary, OrganizationCard } from '@/types/contract';

export function useHomeSummary() {
  return useQuery({
    queryKey: queryKeys.home,
    queryFn: ({ signal }) => apiGet<HomeSummary>('/home/summary', { signal }),
  });
}

/** 首页"贡献组织卡片墙"数据源：全量组织 + 贡献分 + 按分降序（见 02 文档 3.1 与 ADR-0001） */
export function useContributingOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations('contributing'),
    queryFn: ({ signal }) =>
      apiGet<OrganizationCard[]>('/organizations', {
        params: { scope: 'contributing' },
        signal,
      }),
  });
}
