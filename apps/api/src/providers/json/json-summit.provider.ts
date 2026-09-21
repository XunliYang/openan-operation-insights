import { Inject, Injectable } from '@nestjs/common';
import { SummitDetail, SummitSummary } from '../../contract/entities';
import { JsonRepository } from '../../repositories/json-repository';
import { SUMMITS_REPOSITORY } from '../../repositories/repository.tokens';
import { SummitPort, SummitQuery } from '../ports/summit.port';

/**
 * isUpcoming 的口径为"未结束"：以 endDate 与当前时间比较重新计算，
 * 避免静态种子数据随着时间推移而失效。
 */
function normalizeIsUpcoming(summit: SummitDetail): SummitDetail {
  return { ...summit, isUpcoming: Date.parse(summit.endDate) >= Date.now() };
}

function toSummary(summit: SummitDetail): SummitSummary {
  return {
    id: summit.id,
    name: summit.name,
    startDate: summit.startDate,
    endDate: summit.endDate,
    location: summit.location,
    websiteUrl: summit.websiteUrl,
    isUpcoming: summit.isUpcoming,
  };
}

@Injectable()
export class JsonSummitProvider implements SummitPort {
  constructor(
    @Inject(SUMMITS_REPOSITORY)
    private readonly repository: JsonRepository<SummitDetail[]>,
  ) {}

  async listSummits(query: SummitQuery): Promise<SummitSummary[] | SummitDetail[]> {
    const { data } = await this.repository.read();
    let result = data.map(normalizeIsUpcoming);

    if (query.year !== undefined) {
      result = result.filter((summit) => new Date(summit.startDate).getUTCFullYear() === query.year);
    }

    if (query.upcomingOnly) {
      result = result.filter((summit) => summit.isUpcoming);
    }

    // 默认排序：startDate 降序（最近的峰会在最上）
    result.sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate));

    return query.includeDetail ? result : result.map(toSummary);
  }

  async getSummitById(id: string): Promise<SummitDetail | null> {
    const { data } = await this.repository.read();
    const found = data.find((summit) => summit.id === id);
    return found ? normalizeIsUpcoming(found) : null;
  }

  async getSummitSummaryById(id: string): Promise<SummitSummary | null> {
    const detail = await this.getSummitById(id);
    return detail ? toSummary(detail) : null;
  }

  async getNextSummit(): Promise<SummitSummary | null> {
    const { data } = await this.repository.read();
    const upcoming = data
      .map(normalizeIsUpcoming)
      .filter((summit) => summit.isUpcoming)
      .sort((a, b) => Date.parse(b.endDate) - Date.parse(a.endDate));

    return upcoming.length > 0 ? toSummary(upcoming[0]) : null;
  }
}
