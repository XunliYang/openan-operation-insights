import { Inject, Injectable, Logger } from '@nestjs/common';
import { Contributor, ContributorContribution } from '../../contract/entities';
import { JsonRepository } from '../../repositories/json-repository';
import { CONTRIBUTORS_REPOSITORY } from '../../repositories/repository.tokens';
import {
  ContributorContributionPort,
  ContributorContributionQuery,
} from '../ports/contributor-contribution.port';

/** 独立开发者伪组织 orgId（与 collector.constants / organizations.json 保持一致） */
const ORG_UNATTRIBUTED = 'unattributed';

const hasMetrics = (item: Contributor): item is ContributorContribution => Boolean(item.github);

@Injectable()
export class JsonContributorContributionProvider implements ContributorContributionPort {
  private readonly logger = new Logger(JsonContributorContributionProvider.name);

  constructor(
    @Inject(CONTRIBUTORS_REPOSITORY)
    private readonly repository: JsonRepository<Contributor[]>,
  ) {}

  async getContributorContributions(
    query: ContributorContributionQuery,
  ): Promise<ContributorContribution[]> {
    const { data } = await this.repository.read();

    if (query.from || query.to) {
      // 阶段一本地数据无时间维度明细，接受参数但返回全量（见 04 文档 5.3.3）
      this.logger.debug('阶段一忽略 from/to 过滤，返回全量个人贡献');
    }

    // 仅返回带采集指标的个人：纯档案条目（无 github）不参与排行
    const withMetrics = data.filter(hasMetrics);

    if (!query.orgIds?.length) {
      return withMetrics;
    }

    const whitelist = new Set(query.orgIds);
    const knownIds = new Set(withMetrics.map((item) => item.orgId ?? ORG_UNATTRIBUTED));
    const unknown = query.orgIds.filter((id) => !knownIds.has(id));
    if (unknown.length > 0) {
      this.logger.warn(`忽略未知 orgId：${unknown.join(', ')}`);
    }

    // orgId 为空 = 独立贡献者，按伪组织 unattributed 参与组织筛选（04 文档 §3.7）
    return withMetrics.filter((item) => whitelist.has(item.orgId ?? ORG_UNATTRIBUTED));
  }
}
