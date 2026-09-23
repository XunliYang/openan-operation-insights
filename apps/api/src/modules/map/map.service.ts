import { Inject, Injectable, Logger } from '@nestjs/common';
import { MapSource, MapSourceSummary } from '../../contract/entities';
import { ErrorCode } from '../../common/constants/error-code';
import { DomainException } from '../../common/exceptions/domain.exception';
import { MAP_PORT, ORGANIZATION_PORT } from '../../providers/tokens';
import { MapPort } from '../../providers/ports/map.port';
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

  async getSource(sourceId: string): Promise<MapSource> {
    const source = await this.maps.getSource(sourceId);
    if (!source) {
      throw new DomainException(ErrorCode.RESOURCE_NOT_FOUND, `地图数据源不存在：${sourceId}`);
    }
    await this.warnDanglingOrgIds(source);
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