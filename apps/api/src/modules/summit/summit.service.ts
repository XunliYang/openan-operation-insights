import { Inject, Injectable } from '@nestjs/common';
import { SummitDetail, SummitSummary } from '../../contract/entities';
import { Paginated } from '../../common/dto/api-response.dto';
import { ErrorCode } from '../../common/constants/error-code';
import { DomainException } from '../../common/exceptions/domain.exception';
import { SUMMIT_PORT } from '../../providers/tokens';
import { SummitPort } from '../../providers/ports/summit.port';
import { ListSummitsQueryDto } from './dto/list-summits-query.dto';

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

@Injectable()
export class SummitService {
  constructor(@Inject(SUMMIT_PORT) private readonly summits: SummitPort) {}

  async listSummits(
    query: ListSummitsQueryDto,
  ): Promise<Paginated<SummitSummary | SummitDetail>> {
    this.assertYear(query.year);

    const all = await this.summits.listSummits({
      year: query.year,
      includeDetail: query.includeDetail,
      upcomingOnly: query.upcomingOnly,
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;

    return {
      items: all.slice(start, start + pageSize),
      total: all.length,
      page,
      pageSize,
    };
  }

  async getSummitById(id: string): Promise<SummitDetail> {
    const summit = await this.summits.getSummitById(id);
    if (!summit) {
      throw new DomainException(ErrorCode.SUMMIT_NOT_FOUND, `峰会不存在：${id}`);
    }
    return summit;
  }

  private assertYear(year?: number): void {
    if (year === undefined) return;
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
      throw new DomainException(
        ErrorCode.INVALID_YEAR,
        `year 需在 ${MIN_YEAR}-${MAX_YEAR} 之间，当前值：${year}`,
      );
    }
  }
}
