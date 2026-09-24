import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MapMarker, MapSource, MapSourceSummary, ManualMapMarker } from '../../contract/entities';
import { JsonRepository } from '../../repositories/json-repository';
import {
  MAP_SOURCES_REPOSITORY,
  MAP_SOURCES_MANUAL_REPOSITORY,
} from '../../repositories/repository.tokens';
import { ManualMarkerInput, MapPort } from '../ports/map.port';

/**
 * 地图 JSON 适配器：读内置种子 + 人工叠加两个仓库并合并，并提供受令牌保护的人工层写能力。
 *
 * 合并规则（见父 issue ADR-0002 / 本轮 ADR-0008）：
 * - 同 sourceId + 同 markerId → manual 覆盖 builtin，否则追加；
 * - origin 由合并逻辑写入（builtin 项 'builtin'，人工项 'manual'），不采信文件声明；
 * - category 缺省归一化为 'other'（响应体必定有值）；
 * - source.updatedAt 取内置种子 updatedAt 与人工层 updatedAt 中较晚者（人工层每次写入都会刷新自己的 updatedAt）；
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
    private readonly config: ConfigService,
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

  isWritable(): boolean {
    return Boolean(this.config.get<string>('mapWriteToken'));
  }

  async upsertManualMarker(sourceId: string, marker: ManualMarkerInput): Promise<MapSource | null> {
    const seeds = (await this.sources.read()).data;
    if (!seeds.some((source) => source.sourceId === sourceId)) {
      this.logger.warn(`upsertManualMarker：sourceId=${sourceId} 在 map-sources.json 中不存在，拒绝写入`);
      return null;
    }

    // 复用 JsonRepository.update()：原子写 + 单文件串行队列，不自行 writeFile。
    // update() 会刷新内存缓存，写入后读路径立刻可见（不依赖 15 秒 TTL）。
    await this.manual.update((current) => {
      const next = current.filter(
        (item) => !(item.sourceId === sourceId && item.markerId === marker.markerId),
      );
      const entry: ManualMapMarker = {
        ...marker,
        sourceId,
        origin: 'manual',
        logoUrl: marker.logoUrl ?? '',
        category: marker.category ?? 'other',
      };
      next.push(entry);
      return next;
    });

    return this.getSource(sourceId);
  }

  async deleteManualMarker(sourceId: string, markerId: string): Promise<MapSource | null> {
    const manualMarkers = (await this.manual.read()).data;
    const existsInManual = manualMarkers.some(
      (item) => item.sourceId === sourceId && item.markerId === markerId,
    );
    if (!existsInManual) {
      this.logger.warn(
        `deleteManualMarker：markerId=${markerId}（sourceId=${sourceId}）不在人工层，拒绝删除`,
      );
      return null;
    }

    await this.manual.update((current) =>
      current.filter((item) => !(item.sourceId === sourceId && item.markerId === markerId)),
    );

    return this.getSource(sourceId);
  }

  private async readMerged(): Promise<MapSource[]> {
    const [seedEnvelope, manualEnvelope] = await Promise.all([
      this.sources.read(),
      this.manual.read(),
    ]);
    const seeds = seedEnvelope.data;
    const manualMarkers = manualEnvelope.data;
    const manualUpdatedAt = manualEnvelope.updatedAt;

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
      // 人工叠加后「数据更新于」随之刷新：取内置与人工两层 updatedAt 中较晚者。
      const updatedAt =
        manualForSource.length > 0 ? laterIso(source.updatedAt, manualUpdatedAt) : source.updatedAt;
      return { ...source, markers: this.mergeMarkers(source.markers, manualForSource), updatedAt };
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
      byId.set(marker.markerId, normalizeMarker({ ...marker, origin: 'builtin' }));
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
    return { ...fields, origin: 'manual', category: fields.category ?? 'other' };
  }
}

/** 响应体必定有 category；入库缺省时归一化为 'other'。 */
function normalizeMarker(marker: MapMarker): MapMarker {
  return marker.category ? marker : { ...marker, category: 'other' };
}

/** 取两个 ISO 8601 时间戳中较晚者。 */
function laterIso(a: string, b: string): string {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  return Number.isFinite(tb) && tb > ta ? b : a;
}
