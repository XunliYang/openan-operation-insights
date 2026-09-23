import { Inject, Injectable, Logger } from '@nestjs/common';
import { MapMarker, MapSource, MapSourceSummary, ManualMapMarker } from '../../contract/entities';
import { JsonRepository } from '../../repositories/json-repository';
import {
  MAP_SOURCES_REPOSITORY,
  MAP_SOURCES_MANUAL_REPOSITORY,
} from '../../repositories/repository.tokens';
import { MapPort } from '../ports/map.port';

/**
 * 地图 JSON 适配器：读内置种子 + 人工叠加两个仓库并合并。
 *
 * 合并规则（见父 issue ADR-0002）：
 * - 同 sourceId + 同 markerId → manual 覆盖 builtin，否则追加；
 * - origin 由合并逻辑写入（builtin 项 'builtin'，人工项 'manual'），不采信文件声明；
 * - 合并后按 countryName 升序、其次 label 升序（稳定）；
 * - 人工条目的 sourceId 在内置源中不存在时记 WARN 并跳过（不新增 source）。
 */
@Injectable()
export class JsonMapProvider implements MapPort {
  private readonly logger = new Logger(JsonMapProvider.name);

  constructor(
    @Inject(MAP_SOURCES_REPOSITORY)
    private readonly sources: JsonRepository<MapSource[]>,
    @Inject(MAP_SOURCES_MANUAL_REPOSITORY)
    private readonly manual: JsonRepository<ManualMapMarker[]>,
  ) {}

  async listSources(): Promise<MapSourceSummary[]> {
    const merged = await this.readMerged();
    return merged.map((source) => ({
      sourceId: source.sourceId,
      name: source.name,
      description: source.description,
      scenario: source.scenario,
      mapScope: source.mapScope,
      markerCount: source.markers.length,
      updatedAt: source.updatedAt,
    }));
  }

  async getSource(sourceId: string): Promise<MapSource | null> {
    const merged = await this.readMerged();
    return merged.find((source) => source.sourceId === sourceId) ?? null;
  }

  private async readMerged(): Promise<MapSource[]> {
    const [{ data: seeds }, { data: manualMarkers }] = await Promise.all([
      this.sources.read(),
      this.manual.read(),
    ]);

    const manualBySource = new Map<string, ManualMapMarker[]>();
    for (const marker of manualMarkers) {
      const list = manualBySource.get(marker.sourceId) ?? [];
      list.push(marker);
      manualBySource.set(marker.sourceId, list);
    }

    let overridden = 0;
    const merged = seeds.map((source) => {
      const manualForSource = manualBySource.get(source.sourceId) ?? [];
      const builtinIds = new Set(source.markers.map((marker) => marker.markerId));
      for (const marker of manualForSource) {
        if (builtinIds.has(marker.markerId)) overridden += 1;
      }
      return { ...source, markers: this.mergeMarkers(source.markers, manualForSource) };
    });

    const seedSourceIds = new Set(seeds.map((source) => source.sourceId));
    for (const [sourceId, markers] of manualBySource) {
      if (!seedSourceIds.has(sourceId)) {
        this.logger.warn(
          `人工叠加条目的 sourceId=${sourceId} 在 map-sources.json 中不存在，已跳过 ${markers.length} 条`,
        );
      }
    }

    this.logger.log(
      `地图数据合并：seed=${seeds.length} source，manual=${manualMarkers.length} 条，覆盖=${overridden} 条`,
    );
    return merged;
  }

  private mergeMarkers(builtin: MapMarker[], manual: ManualMapMarker[]): MapMarker[] {
    const byId = new Map<string, MapMarker>();

    for (const marker of builtin) {
      byId.set(marker.markerId, { ...marker, origin: 'builtin' });
    }
    for (const marker of manual) {
      byId.set(marker.markerId, this.toManualMarker(marker));
    }

    return Array.from(byId.values()).sort((a, b) => {
      const byCountry = a.countryName.localeCompare(b.countryName);
      if (byCountry !== 0) return byCountry;
      return a.label.localeCompare(b.label);
    });
  }

  private toManualMarker(marker: ManualMapMarker): MapMarker {
    const { sourceId: _sourceId, origin: _declaredOrigin, ...fields } = marker;
    return { ...fields, origin: 'manual' };
  }
}