import { Inject, Injectable } from '@nestjs/common';
import { OrganizationInsight } from '../../contract/entities';
import { JsonRepository } from '../../repositories/json-repository';
import { INSIGHTS_REPOSITORY } from '../../repositories/repository.tokens';
import { InsightPort, InsightQuery } from '../ports/insight.port';

@Injectable()
export class JsonInsightProvider implements InsightPort {
  constructor(
    @Inject(INSIGHTS_REPOSITORY)
    private readonly repository: JsonRepository<OrganizationInsight[]>,
  ) {}

  async getInsights(query: InsightQuery): Promise<OrganizationInsight[]> {
    const { data } = await this.repository.read();

    if (!query.orgIds?.length) {
      return data;
    }

    const whitelist = new Set(query.orgIds);
    return data.filter((item) => whitelist.has(item.orgId));
  }
}
