import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrganizationContribution } from '../../contract/entities';
import { JsonRepository } from '../../repositories/json-repository';
import { CONTRIBUTIONS_REPOSITORY } from '../../repositories/repository.tokens';
import { ContributionPort, ContributionQuery } from '../ports/contribution.port';

@Injectable()
export class JsonContributionProvider implements ContributionPort {
  private readonly logger = new Logger(JsonContributionProvider.name);

  constructor(
    @Inject(CONTRIBUTIONS_REPOSITORY)
    private readonly repository: JsonRepository<OrganizationContribution[]>,
  ) {}

  async getContributions(query: ContributionQuery): Promise<OrganizationContribution[]> {
    const { data } = await this.repository.read();

    if (query.from || query.to) {
      // 阶段一本地数据无时间维度明细，接受参数但返回全量（见 04 文档 5.3.3）
      this.logger.debug('阶段一忽略 from/to 过滤，返回全量贡献数据');
    }

    if (!query.orgIds?.length) {
      return data;
    }

    const whitelist = new Set(query.orgIds);
    const knownIds = new Set(data.map((item) => item.orgId));
    const unknown = query.orgIds.filter((id) => !knownIds.has(id));
    if (unknown.length > 0) {
      this.logger.warn(`忽略未知 orgId：${unknown.join(', ')}`);
    }

    return data.filter((item) => whitelist.has(item.orgId));
  }
}
