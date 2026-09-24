import * as L from 'leaflet';

/**
 * 底图策略的 seam（ADR-0006）：Leaflet 瓦片层 / 本地矢量轮廓层，及二者的自动回落。
 *
 * - `street`：瓦片底图（默认 Esri World_Dark_Gray_Base，可经 VITE_MAP_TILE_URL 换成内网瓦片服务）。
 * - `outline`：本地 `map/world.json` 矢量轮廓（离线兜底，深色观感沿用旧 ECharts geo）。
 * - `auto`：先挂 street，收到首个 `tileerror` 时切到 outline 并回调 onTileUnavailable。
 *
 * `world.json` 继续作为静态资产随 `dist/map/world.json` 发布，不把 GeoJSON 打进 JS。
 */

export type BasemapMode = 'street' | 'outline' | 'auto';

export interface BasemapHandle {
  /** 当前实际生效的底图（auto 回落后为 'outline'） */
  mode: 'street' | 'outline';
  setMode(next: 'street' | 'outline'): void;
  dispose(): void;
}

export interface BasemapOptions {
  mode: BasemapMode;
  tileUrl: string;
  worldGeoUrl: string;
  /** 首个 tileerror 触发（仅 auto 模式） */
  onTileUnavailable?: () => void;
}

/** 矢量轮廓样式：沿用旧 ECharts geo 的深色国界观感 */
const OUTLINE_STYLE: L.PathOptions = {
  color: 'rgba(148,163,184,0.38)',
  weight: 0.6,
  fillColor: 'rgba(30,41,59,0.38)',
  fillOpacity: 1,
};

const TILE_ATTRIBUTION =
  'Powered by <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> — Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community';

export function createBasemap(map: L.Map, opts: BasemapOptions): BasemapHandle {
  const { tileUrl, worldGeoUrl, onTileUnavailable } = opts;
  const auto = opts.mode === 'auto';

  let resolvedMode: 'street' | 'outline' = opts.mode === 'outline' ? 'outline' : 'street';
  let currentLayer: L.TileLayer | L.GeoJSON | null = null;
  let outlinePromise: Promise<L.GeoJSON> | null = null;
  let fallbackFired = false;
  let disposed = false;
  let generation = 0;

  function buildTileLayer(): L.TileLayer {
    return L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: TILE_ATTRIBUTION,
    });
  }

  function removeCurrent(): void {
    if (currentLayer) {
      map.removeLayer(currentLayer);
      currentLayer = null;
    }
  }

  function loadOutline(): Promise<L.GeoJSON> {
    if (!outlinePromise) {
      outlinePromise = fetch(worldGeoUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((raw) => {
          // echarts 的 world.json 是「缺 type:Feature 包装」的非标准 GeoJSON，
          // Leaflet 的 L.geoJSON 会严格校验并抛 "Invalid GeoJSON object"。
          // 这里在不改静态资产的前提下补全 Feature 包装以兼容 Leaflet。
          const data = raw as {
            type?: string;
            features?: Array<{ type?: string; geometry?: unknown; properties?: unknown }>;
          };
          const features = (data.features ?? []).map((feature) => ({
            type: 'Feature' as const,
            geometry: feature.geometry,
            properties: feature.properties,
          }));
          return L.geoJSON({ type: 'FeatureCollection', features } as unknown as GeoJSON.FeatureCollection, {
            style: () => OUTLINE_STYLE,
            interactive: false,
          });
        });
    }
    return outlinePromise;
  }

  function handleTileError(): void {
    if (disposed || fallbackFired) return;
    fallbackFired = true;
    setMode('outline');
    onTileUnavailable?.();
  }

  function setMode(next: 'street' | 'outline'): void {
    const gen = ++generation;

    if (next === 'street') {
      removeCurrent();
      const layer = buildTileLayer();
      if (auto) layer.on('tileerror', handleTileError);
      layer.addTo(map);
      currentLayer = layer;
      resolvedMode = 'street';
      return;
    }

    // outline：本地 GeoJSON 需异步 fetch；期间保留当前层避免闪烁，竞态时以最新一次 setMode 为准
    void loadOutline().then((layer) => {
      if (disposed || gen !== generation) return;
      removeCurrent();
      layer.addTo(map);
      currentLayer = layer;
      resolvedMode = 'outline';
    });
  }

  function dispose(): void {
    disposed = true;
    generation += 1;
    removeCurrent();
  }

  setMode(resolvedMode);

  return {
    get mode() {
      return resolvedMode;
    },
    setMode,
    dispose,
  };
}