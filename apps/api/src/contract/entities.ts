/**
 * 契约实体定义 —— 唯一来源为 docs/04-data-and-api-contract.md。
 * 端口（providers/ports）与前端 types/ 必须与此逐字段对齐。
 */

export type OrganizationType = 'partner' | 'external' | 'community' | 'individual';
export type DeltaDirection = 'up' | 'down' | 'flat';

export interface Organization {
  orgId: string;
  name: string;
  logoUrl: string;
  homepageUrl: string;
  type: OrganizationType;
  tags: string[];
  aliases?: Record<string, string>;
  /** 组织邮箱域名后缀清单（小写），用于按贡献者邮箱域名自动归属；如 ["huawei.com"] */
  emailDomains?: string[];
  joinedAt?: string;
  description?: string;
}

export interface GithubMetrics {
  /** 已合并（merged）PR 数 */
  pullRequests: number;
  /** 合并 PR 内的提交数（各 PR commits.totalCount 累计） */
  commits: number;
  issues: number;
  /** additions + deletions */
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
  /** GitHub 协作指标（ADR-0003）：仅采集到贡献记录的个人才有；人工维护的纯档案可缺失 */
  github?: GithubMetrics;
}

/** GET /api/contributor-contributions 的响应条目：带采集指标的个人贡献（github 恒有值） */
export type ContributorContribution = Contributor & { github: GithubMetrics };

export interface SummitSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  websiteUrl: string;
  /** 未结束即为 true（进行中的峰会同为 true） */
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

export interface MetricValue {
  value: number;
  unit?: string;
  delta?: number;
  deltaDirection?: DeltaDirection;
}

/** data/home.json 的 data 结构 */
export interface HomeFileData {
  partnerCount: MetricValue;
  externalDeveloperCount: MetricValue;
  summitCount: MetricValue;
  useCaseCount: MetricValue;
  nextSummitId: string | null;
}

/** GET /api/home/summary 的响应 data */
export interface HomeSummary extends Omit<HomeFileData, 'nextSummitId'> {
  nextSummit: SummitSummary | null;
  updatedAt: string;
}

/** 组织卡片：贡献度等级为 Service 计算的派生字段 */
export type ContributionLevel = 'high' | 'medium' | 'low';

export interface OrganizationCard extends Organization {
  contributionLevel?: ContributionLevel;
  contributionScore?: number;
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

/**
 * 例会参会矩阵（ADR-0005）—— 无主键、无规范化、无聚合。
 * 直接照搬运营台账：列为人名原文、行为日期，格子表示是否出席。
 */
export interface MeetingAttendanceRow {
  /** 例会日期，`YYYY-MM-DD` */
  date: string;
  /** 出席标记，与 columns 等长、同序（true=出席，false=缺席） */
  attendance: boolean[];
}

export interface MeetingAttendanceMatrix {
  /** 列头：人名原文（照搬台账，保留原序与原文） */
  columns: string[];
  /** 每次例会一行，保持台账原序（不在接口层排序） */
  rows: MeetingAttendanceRow[];
  /** 台账最后同步时间（ISO 8601），由采集脚本写入 */
  updatedAt?: string;
}
