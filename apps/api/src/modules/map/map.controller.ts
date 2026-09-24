import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MapSource, MapSourceSummary } from '../../contract/entities';
import { ErrorCode } from '../../common/constants/error-code';
import { DomainException } from '../../common/exceptions/domain.exception';
import { MapWriteGuard } from './map-write.guard';
import { CacheNoStoreInterceptor } from './cache-no-store.interceptor';
import { UpsertMapMarkerDto } from './dto/upsert-map-marker.dto';
import { MapService } from './map.service';

@Controller('maps')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  /** GET /api/maps —— 数据源汇总列表 */
  @Get()
  list(): Promise<MapSourceSummary[]> {
    return this.mapService.listSources();
  }

  /** GET /api/maps/capabilities —— 写能力查询（无需令牌） */
  @Get('capabilities')
  capabilities(): { writable: boolean } {
    return { writable: this.mapService.isWritable() };
  }

  /** GET /api/maps/:sourceId —— 单个数据源（含合并后的 markers） */
  @Get(':sourceId')
  getSource(@Param('sourceId') sourceId: string): Promise<MapSource> {
    return this.mapService.getSource(sourceId);
  }

  /** POST /api/maps/:sourceId/markers —— 新增人工层标记（markerId 在请求体必填） */
  @UseGuards(MapWriteGuard)
  @UseInterceptors(CacheNoStoreInterceptor)
  @Post(':sourceId/markers')
  create(
    @Param('sourceId') sourceId: string,
    @Body() dto: UpsertMapMarkerDto,
  ): Promise<MapSource> {
    const { markerId, ...fields } = dto;
    if (!markerId) {
      throw new DomainException(ErrorCode.VALIDATION_FAILED, '新增标记必须提供 markerId');
    }
    return this.mapService.upsertManualMarker(sourceId, { markerId, ...fields });
  }

  /** PUT /api/maps/:sourceId/markers/:markerId —— 覆盖人工层标记（markerId 从路径取） */
  @UseGuards(MapWriteGuard)
  @UseInterceptors(CacheNoStoreInterceptor)
  @Put(':sourceId/markers/:markerId')
  update(
    @Param('sourceId') sourceId: string,
    @Param('markerId') markerId: string,
    @Body() dto: UpsertMapMarkerDto,
  ): Promise<MapSource> {
    if (dto.markerId !== undefined) {
      throw new DomainException(ErrorCode.VALIDATION_FAILED, 'markerId 应从路径提供，请求体不应包含 markerId');
    }
    const { markerId: _ignored, ...fields } = dto;
    return this.mapService.upsertManualMarker(sourceId, { markerId, ...fields });
  }

  /** DELETE /api/maps/:sourceId/markers/:markerId —— 删除人工层标记（内置 seed 不可删） */
  @UseGuards(MapWriteGuard)
  @UseInterceptors(CacheNoStoreInterceptor)
  @Delete(':sourceId/markers/:markerId')
  remove(
    @Param('sourceId') sourceId: string,
    @Param('markerId') markerId: string,
  ): Promise<MapSource> {
    return this.mapService.deleteManualMarker(sourceId, markerId);
  }
}