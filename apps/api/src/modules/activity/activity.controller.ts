import { Controller, Get, Query } from '@nestjs/common';
import {
  ContributionSummaryData,
  ContributorContribution,
  OrganizationContribution,
  OrganizationInsight,
} from '../../contract/entities';
import { ActivityService } from './activity.service';
import {
  ContributionSummaryQueryDto,
  ListContributionsQueryDto,
  ListContributorContributionsQueryDto,
  ListInsightsQueryDto,
} from './dto/activity-query.dto';

@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /** GET /api/contributions —— 社区活跃度：GitHub 贡献明细 */
  @Get('contributions')
  listContributions(@Query() query: ListContributionsQueryDto): Promise<OrganizationContribution[]> {
    return this.activityService.listContributions(query);
  }

  /** GET /api/contributor-contributions —— 社区活跃度：个人贡献明细（ADR-0003） */
  @Get('contributor-contributions')
  listContributorContributions(
    @Query() query: ListContributorContributionsQueryDto,
  ): Promise<ContributorContribution[]> {
    return this.activityService.listContributorContributions(query);
  }

  /** GET /api/contributions/summary —— 汇总指标（环形图数据源） */
  @Get('contributions/summary')
  getContributionSummary(
    @Query() query: ContributionSummaryQueryDto,
  ): Promise<ContributionSummaryData> {
    return this.activityService.getSummary(query);
  }

  /** GET /api/insights —— 社区活跃度：Confluence 成果明细 */
  @Get('insights')
  listInsights(@Query() query: ListInsightsQueryDto): Promise<OrganizationInsight[]> {
    return this.activityService.listInsights(query);
  }
}
