import { Inject, Injectable, Logger } from '@nestjs/common';
import { MapSource, MapSourceSummary } from '../../contract/entities';
import { ErrorCode } from '../../common/constants/error-code';
import { DomainException } from '../../common/exceptions/domain.exception';
import { MAP_PORT, ORGANIZATION_PORT } from '../../providers/tokens';
import { ManualMarkerInput, MapPort } from '../../providers/ports/map.port';
import { OrganizationPort } from '../../providers/ports/organization.port';

@Injectable()
export class MapService {
  private readonly logger = new Logger(MapService.name);

  constructor(
    @Inject(MAP_PORT) private readonly maps: MapPort,
    @Inject(ORGANIZATION_PORT) private readonly organizations: OrganizationPort,
  ) {}

  listSources(): Promise<MapSourceSummary[]> {
    return this.maps.listSources();
  }

  isWritable(): boolean {
    return this.maps.isWritable();
  }

  async getSource(sourceId: string): Promise<MapSource> {
    const source = await this.maps.getSource(sourceId);
    if (!source) {
      throw new DomainException(ErrorCode.RESOURCE_NOT_FOUND, `地图数据源不存在：${sourceId}`);
    }
    await this.warnDanglingOrgIds(source);
    return source;
  }

  /** 新增或覆盖人工层标记（同 markerId 覆盖）；未知 source → 40400 */
  async upsertManualMarker(sourceId: string, marker: ManualMarkerInput): Promise<MapSource> {
    const source = await this.maps.upsertManualMarker(sourceId, marker);
    if (!source) {
      throw new DomainException(ErrorCode.RESOURCE_NOT_FOUND, `地图数据源不存在：${sourceId}`);
    }
    return source;
  }

  /** 仅删除人工层条目；内置 seed 不可删（未知/不可删 → 40400） */
  async deleteManualMarker(sourceId: string, markerId: string): Promise<MapSource> {
    const source = await this.maps.deleteManualMarker(sourceId, markerId);
    if (!source) {
      throw new DomainException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `标记不存在或不可删除：${markerId}（内置种子只能覆盖或恢复默认，不能删除）`,
      );
    }
    return source;
  }

  /**
   * 标记的 orgId 在组织档案中查不到时告警（不阻断，只提示数据口径问题）。
   * 沿用 organization.service.ts 的告警风格：整体判断、单条 WARN 汇总。
   */
  private async warnDanglingOrgIds(source: MapSource): Promise<void> {
    const orgIds = [
      ...new Set(
        source.markers
          .map((marker) => marker.orgId)
          .filter((orgId): orgId is string => typeof orgId === 'string' && orgId.length > 0),
      ),
    ];
    if (orgIds.length === 0) return;

    const organizations = await this.organizations.listOrganizations({});
    const known = new Set(organizations.map((org) => org.orgId));
    const dangling = orgIds.filter((orgId) => !known.has(orgId));

    if (dangling.length > 0) {
      this.logger.warn(
        `地图标记引用了不存在的组织档案：${dangling.join(', ')}（source=${source.sourceId}）`,
      );
    }
  }
}