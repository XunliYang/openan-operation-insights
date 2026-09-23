/**
 * 契约类型 —— 与 docs/04-data-and-api-contract.md 及后端 contract/entities.ts 逐字段对齐。
 * 修改任一侧必须同步修改另一侧。
 */

export type OrganizationType = 'partner' | 'external' | 'community' | 'individual';
export type DeltaDirection = 'up' | 'down' | 'flat';
export type ContributionLevel = 'high' | 'medium' | 'low';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MetricValue {
  value: number;
  unit?: string;
  delta?: number;
  deltaDirection?: DeltaDirection;
}

export interface Organization {
  orgId: string;
  name: string;
  logoUrl: string;
  homepageUrl: string;
  type: OrganizationType;
  tags: string[];
  aliases?: Record<string, string>;
  /** 组织邮箱域名后缀清单（小写），用于按贡献者邮箱域名自动归属 */
  emailDomains?: string[];
  joinedAt?: string;
  description?: string;
}

export interface OrganizationCard extends Organization {
  contributionLevel?: ContributionLevel;
  contributionScore?: number;
}

export interface GithubMetrics {
  pullRequests: number;
  commits: number;
  issues: number;
  linesChanged: number;
  repos: number;
}

export interface OrganizationContribution {
  orgId: string;
  orgName: string;
  logoUrl: string;
  homepageUrl: string;
  github: GithubMetrics;
  updatedAt: string;
}

export interface ConfluenceMetrics {
  requirements: number;
  bestPractices: number;
}

export interface OrganizationInsight {
  orgId: string;
  orgName: string;
  logoUrl: string;
  confluence: ConfluenceMetrics;
  updatedAt: string;
}

export interface SummitSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  websiteUrl: string;
  isUpcoming: boolean;
}

export interface SummitDetail extends SummitSummary {
  description: string;
  hostOrgId?: string | null;
  host: string;
  attendeeCount: number;
  attendingOrganizations: string[];
  agendaHighlights: string[];
  outcomes: string[];
  minutesUrl?: string;
}

export interface HomeSummary {
  partnerCount: MetricValue;
  externalDeveloperCount: MetricValue;
  summitCount: MetricValue;
  useCaseCount: MetricValue;
  nextSummit: SummitSummary | null;
  updatedAt: string;
}

export interface ContributionTotals {
  pullRequests: number;
  commits: number;
  issues: number;
  linesChanged: number;
  requirements: number;
  bestPractices: number;
}

export interface ContributionSummaryData {
  totals: ContributionTotals;
  orgCount: number;
  updatedAt: string;
}

export type MapScenario = 'ecosystem' | 'co-creation' | 'summit';
export type MapScope = 'world' | 'china';
export type MarkerOrigin = 'builtin' | 'manual';

export interface MapMarker {
  markerId: string;
  label: string;
  logoUrl: string;
  homepageUrl?: string;
  countryCode: string;
  countryName: string;
  longitude: number;
  latitude: number;
  locationLabel?: string;
  group?: string;
  orgId?: string | null;
  description?: string;
  origin: MarkerOrigin;
}

export interface MapSource {
  sourceId: string;
  name: string;
  description?: string;
  scenario: MapScenario;
  mapScope: MapScope;
  markers: MapMarker[];
  updatedAt: string;
}

export interface MapSourceSummary {
  sourceId: string;
  name: string;
  description?: string;
  scenario: MapScenario;
  mapScope: MapScope;
  markerCount: number;
  updatedAt: string;
}
