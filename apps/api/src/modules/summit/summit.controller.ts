import { Controller, Get, Param, Query } from '@nestjs/common';
import { SummitDetail, SummitSummary } from '../../contract/entities';
import { Paginated } from '../../common/dto/api-response.dto';
import { ListSummitsQueryDto } from './dto/list-summits-query.dto';
import { SummitService } from './summit.service';

@Controller('summits')
export class SummitController {
  constructor(private readonly summitService: SummitService) {}

  /** GET /api/summits?year=&includeDetail=&upcomingOnly=&page=&pageSize= */
  @Get()
  list(@Query() query: ListSummitsQueryDto): Promise<Paginated<SummitSummary | SummitDetail>> {
    return this.summitService.listSummits(query);
  }

  /** GET /api/summits/:id —— 峰会详情 */
  @Get(':id')
  getById(@Param('id') id: string): Promise<SummitDetail> {
    return this.summitService.getSummitById(id);
  }
}
