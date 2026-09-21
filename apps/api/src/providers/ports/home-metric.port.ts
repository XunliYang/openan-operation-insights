import { HomeFileData } from '../../contract/entities';

export type { HomeFileData };

export interface HomeMetricsPayload {
  /** home.json 中的指标数值与 nextSummitId 引用 */
  data: HomeFileData;
  /** home.json 的文件更新时间 */
  updatedAt: string;
}

/**
 * 首页指标端口。
 * 返回指标值 + nextSummitId 引用，由 HomeService 结合 SummitPort 组装 HomeSummary。
 */
export interface HomeMetricPort {
  getHomeMetrics(): Promise<HomeMetricsPayload>;
}
