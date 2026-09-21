import { Controller, Get } from '@nestjs/common';
import { HomeSummary } from '../../contract/entities';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /** GET /api/home/summary —— 首页四项指标 + 下一次峰会 */
  @Get('summary')
  getSummary(): Promise<HomeSummary> {
    return this.homeService.getSummary();
  }
}
