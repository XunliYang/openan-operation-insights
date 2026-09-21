import { Inject, Injectable, Logger } from '@nestjs/common';
import { HomeSummary, SummitSummary } from '../../contract/entities';
import { HOME_METRIC_PORT, SUMMIT_PORT } from '../../providers/tokens';
import { HomeMetricPort } from '../../providers/ports/home-metric.port';
import { SummitPort } from '../../providers/ports/summit.port';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    @Inject(HOME_METRIC_PORT) private readonly homeMetric: HomeMetricPort,
    @Inject(SUMMIT_PORT) private readonly summits: SummitPort,
  ) {}

  async getSummary(): Promise<HomeSummary> {
    const { data, updatedAt } = await this.homeMetric.getHomeMetrics();

    return {
      partnerCount: data.partnerCount,
      externalDeveloperCount: data.externalDeveloperCount,
      summitCount: data.summitCount,
      useCaseCount: data.useCaseCount,
      nextSummit: await this.resolveNextSummit(data.nextSummitId),
      updatedAt,
    };
  }

  /**
   * 推导规则（见 04 文档 3.6）：
   * 优先取 nextSummitId 指向的峰会；未配置或该峰会已结束时，
   * 回退为"未结束峰会中 endDate 最晚的一场"；仍无则 null。
   */
  private async resolveNextSummit(nextSummitId: string | null): Promise<SummitSummary | null> {
    if (nextSummitId) {
      const referenced = await this.summits.getSummitSummaryById(nextSummitId);
      if (referenced?.isUpcoming) {
        return referenced;
      }
      if (referenced) {
        this.logger.warn(
          `home.json 的 nextSummitId=${nextSummitId} 指向的峰会已结束，回退为自动推导`,
        );
      } else {
        this.logger.warn(`home.json 的 nextSummitId=${nextSummitId} 无对应峰会，回退为自动推导`);
      }
    }

    return this.summits.getNextSummit();
  }
}
