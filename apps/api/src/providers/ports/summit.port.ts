import { SummitDetail, SummitSummary } from '../../contract/entities';

export type { SummitDetail, SummitSummary };

export interface SummitQuery {
  year?: number;
  includeDetail?: boolean;
  /** 仅返回未结束的峰会 */
  upcomingOnly?: boolean;
}

export interface SummitPort {
  listSummits(query: SummitQuery): Promise<SummitSummary[] | SummitDetail[]>;
  getSummitById(id: string): Promise<SummitDetail | null>;
  getNextSummit(): Promise<SummitSummary | null>;
  /** 供首页按 nextSummitId 精确引用 */
  getSummitSummaryById(id: string): Promise<SummitSummary | null>;
}
