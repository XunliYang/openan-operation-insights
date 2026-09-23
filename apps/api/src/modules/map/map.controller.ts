import { Controller, Get, Param } from '@nestjs/common';
import { MapSource, MapSourceSummary } from '../../contract/entities';
import { MapService } from './map.service';

@Controller('maps')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  /** GET /api/maps —— 数据源汇总列表 */
  @Get()
  list(): Promise<MapSourceSummary[]> {
    return this.mapService.listSources();
  }

  /** GET /api/maps/:sourceId —— 单个数据源（含合并后的 markers） */
  @Get(':sourceId')
  getSource(@Param('sourceId') sourceId: string): Promise<MapSource> {
    return this.mapService.getSource(sourceId);
  }
}