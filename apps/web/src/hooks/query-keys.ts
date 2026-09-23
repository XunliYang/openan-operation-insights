export interface ActivityParams {
  orgIds?: string[];
  from?: string;
  to?: string;
}

export const queryKeys = {
  home: ['home', 'summary'] as const,
  organizations: (scope?: string, type?: string, keyword?: string) =>
    ['organizations', { scope: scope ?? 'all', type: type ?? 'all', keyword: keyword ?? '' }] as const,
  contributions: (params: ActivityParams) =>
    ['contributions', { orgIds: params.orgIds ?? [], from: params.from ?? '', to: params.to ?? '' }] as const,
  contributionSummary: (params: ActivityParams) =>
    ['contributions', 'summary', { orgIds: params.orgIds ?? [], from: params.from ?? '', to: params.to ?? '' }] as const,
  insights: (params: ActivityParams) =>
    ['insights', { orgIds: params.orgIds ?? [], from: params.from ?? '', to: params.to ?? '' }] as const,
  contributorContributions: (params: ActivityParams) =>
    [
      'contributors',
      'contributions',
      { orgIds: params.orgIds ?? [], from: params.from ?? '', to: params.to ?? '' },
    ] as const,
  summits: (year?: number, includeDetail?: boolean, page?: number, pageSize?: number) =>
    ['summits', { year: year ?? null, includeDetail: includeDetail ?? false, page: page ?? 1, pageSize: pageSize ?? 20 }] as const,
  summitDetail: (id: string) => ['summits', 'detail', id] as const,
  mapSources: () => ['maps'] as const,
  mapSource: (sourceId: string) => ['maps', sourceId] as const,
  meetings: ['meetings'] as const,
};
