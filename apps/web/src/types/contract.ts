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

export interface Contributor {
  contributorId: string;
  githubId: number;
  name: string;
  orgId?: string | null;
  avatarUrl?: string;
  joinedAt?: string;
  description?: string;
  /** GitHub 协作指标：仅采集到贡献记录的个人才有；人工维护的纯档案可缺失 */
  github?: GithubMetrics;
}

/** `GET /api/contributor-contributions` 的响应条目：带采集指标的个人贡献（github 恒有值） */
export type ContributorContribution = Contributor & { github: GithubMetrics };

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

export type ParticipantCategory =
  | 'operator'          // 运营商
  | 'equipment-vendor'  // 设备商
  | 'integrator'        // 集成商
  | 'it-vendor'         // IT 厂商
  | 'cloud-vendor'      // 云厂商
  | 'research'          // 研究机构
  | 'other';            // 未分类（人工条目未填时的兜底，前端必须能渲染）

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
  /** 六类分类 + 未分类兜底；响应体必定有值 */
  category: ParticipantCategory;
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

/** `GET /api/maps/capabilities` 响应：写接口是否已启用（后端 MAP_WRITE_TOKEN 已配置） */
export interface MapCapabilities {
  writable: boolean;
}

/**
 * 写接口请求体（POST/PUT /api/maps/:sourceId/markers）。
 * 与后端 UpsertMapMarkerDto 逐字段对齐；`markerId` 仅 POST 时在请求体提供、
 * PUT 从路径取，`origin`/`sourceId` 由后端写入、不在此声明。
 */
export interface UpsertMarkerBody {
  label: string;
  logoUrl?: string;
  homepageUrl?: string;
  countryCode: string;
  countryName: string;
  longitude: number;
  latitude: number;
  locationLabel?: string;
  category?: ParticipantCategory;
  description?: string;
  orgId?: string | null;
}

/**
 * 例会参会矩阵（ADR-0005 / 04 文档 §3.8）—— 无主键、无规范化、无聚合。
 * 直接照搬运营台账：列为人名原文（保留原序），行为日期，格子表示是否出席。
 */
export interface MeetingAttendanceRow {
  /** 例会日期，`YYYY-MM-DD` */
  date: string;
  /** 出席标记，与 columns 等长、同序 */
  attendance: boolean[];
}

export interface MeetingAttendanceMatrix {
  /** 列头：人名原文（照搬台账，保留原序与原文） */
  columns: string[];
  /** 每次例会一行，保持台账原序 */
  rows: MeetingAttendanceRow[];
  /** 台账最后同步时间（ISO 8601） */
  updatedAt?: string;
}
