import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';
import { cn } from '@/lib/cn';
import type { MapSource } from '@/types/contract';
import { MAP_COPY } from './map-copy';
import { hasValidCoordinates } from './markers';
import { createBasemap, type BasemapHandle, type BasemapMode } from './basemap';
import { layoutExpandedCluster, layoutMarkers } from './marker-layout';
import { buildClusterIcon, buildMarkerIcon } from './marker-icons';

export interface MarkerMapProps {
  /** 组件不感知 scenario 语义，只认 MapSource 形状 */
  source: MapSource;
  height?: number | string;
  /** 由页面持有，支持清单↔地图联动；变化时不重建地图、保留当前缩放/中心 */
  selectedMarkerId?: string | null;
  onSelectMarker?: (markerId: string) => void;
  ariaLabel?: string;
  /** 自绘 +/−/复位 缩放按钮（关掉 Leaflet 默认 zoomControl） */
  zoomControls?: boolean;
  /** 底图模式，缺省读 VITE_MAP_BASEMAP */
  basemap?: BasemapMode;
  /** 取点模式：crosshair 光标 + 顶部提示，点击地图回调经纬度 */
  pickMode?: boolean;
  onPickPoint?: (point: { longitude: number; latitude: number }) => void;
}

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const WORLD_GEO_URL = `${BASE_URL}/map/world.json`;
const DEFAULT_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const MIN_ZOOM = 2;
const MAX_ZOOM = 19;
/** 移动端 map 容器高度：58vh，夹在 [320, 640]；桌面高屏时即 640 */
const DEFAULT_HEIGHT = 'clamp(320px, 58vh, 640px)';
/** 置于最上层的 zIndex 偏移，用于高亮选中标记 */
const SELECTED_Z_OFFSET = 1000;

function resolveBasemapMode(value: string | undefined): BasemapMode {
  return value === 'street' || value === 'outline' || value === 'auto' ? value : 'auto';
}

const ENV_BASEMAP = resolveBasemapMode(import.meta.env.VITE_MAP_BASEMAP as string | undefined);
const ENV_TILE_URL =
  (import.meta.env.VITE_MAP_TILE_URL as string | undefined)?.trim() || DEFAULT_TILE_URL;

const ZOOM_BTN =
  'flex h-9 w-9 select-none items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-base font-medium leading-none text-slate-200 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 disabled:pointer-events-none disabled:opacity-50';

/**
 * 可复用地理标记地图（ADR-0006/0007）：Leaflet 命令式封装。
 * - 街道瓦片底图（可达 z19）+ 瓦片不可达自动回落矢量轮廓（非阻塞提示，不白屏）；
 * - layoutMarkers() 像素级环形展开 logo 去重叠，同点过多折叠为计数簇、点簇放大展开；
 * - 自绘缩放按钮、pickMode 取点、selectedMarkerId 高亮（不重建地图）；
 * - logo 缺失/加载失败 → 圆形首字母徽标（与 Avatar 同源）。
 */
export function MarkerMap({
  source,
  height = DEFAULT_HEIGHT,
  selectedMarkerId = null,
  onSelectMarker,
  ariaLabel = source.name,
  zoomControls = true,
  basemap,
  pickMode = false,
  onPickPoint,
}: MarkerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const basemapRef = useRef<BasemapHandle | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerElementsRef = useRef<Map<string, L.Marker>>(new Map());
  const didFitRef = useRef(false);
  const lastSourceIdRef = useRef(source.sourceId);

  const [mapReady, setMapReady] = useState(false);
  const [brokenLogos, setBrokenLogos] = useState<ReadonlySet<string>>(new Set());
  const [logoRatios, setLogoRatios] = useState<Readonly<Record<string, number>>>({});
  const [tileUnavailable, setTileUnavailable] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<ReadonlySet<string>>(new Set());

  const markers = useMemo(() => source.markers.filter(hasValidCoordinates), [source.markers]);
  const hasMarkers = markers.length > 0;
  const layout = useMemo(() => layoutMarkers(markers), [markers]);

  // 最新值 ref：供稳定的 Leaflet 回调读取，避免闭包过期
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const selectedRef = useRef(selectedMarkerId);
  selectedRef.current = selectedMarkerId;
  const pickModeRef = useRef(pickMode);
  pickModeRef.current = pickMode;
  const onSelectRef = useRef(onSelectMarker);
  onSelectRef.current = onSelectMarker;
  const onPickRef = useRef(onPickPoint);
  onPickRef.current = onPickPoint;
  const expandedClustersRef = useRef(expandedClusters);
  expandedClustersRef.current = expandedClusters;
  const brokenRef = useRef(brokenLogos);
  brokenRef.current = brokenLogos;
  const ratiosRef = useRef(logoRatios);
  ratiosRef.current = logoRatios;

  // 预加载 logo：探测加载失败 + 测真实宽高比（复用探测逻辑）
  useEffect(() => {
    const broken = new Set<string>();
    const ratios: Record<string, number> = {};
    const images: HTMLImageElement[] = [];

    for (const marker of markers) {
      const url = marker.logoUrl?.trim();
      if (!url) {
        broken.add(marker.markerId);
        continue;
      }
      const image = new Image();
      image.onload = () => {
        const ratio =
          image.naturalWidth > 0 && image.naturalHeight > 0
            ? image.naturalWidth / image.naturalHeight
            : 3;
        setLogoRatios((prev) => ({ ...prev, [marker.markerId]: ratio }));
      };
      image.onerror = () => {
        setBrokenLogos((prev) => new Set(prev).add(marker.markerId));
      };
      image.src = url;
      images.push(image);
    }

    setBrokenLogos(broken);
    setLogoRatios(ratios);

    return () => {
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [markers]);

  // 复位/初始视图：fit 所有 marker 的 bounds（单点 setView；空则回世界视图）
  const fitToMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = markersRef.current.map((m) => [m.latitude, m.longitude] as [number, number]);
    if (points.length === 0) {
      map.setView([20, 0], MIN_ZOOM);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 8);
      return;
    }
    map.invalidateSize();
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 6 });
    if (map.getZoom() < MIN_ZOOM) map.setZoom(MIN_ZOOM);
  }, []);

  // 选中态应用到已存在标记（不重建地图，保留当前缩放/中心）
  const applySelection = useCallback((selectedId: string | null) => {
    markerElementsRef.current.forEach((marker, id) => {
      const isSelected = id === selectedId;
      const element = marker.getElement();
      element?.classList.toggle('is-selected', isSelected);
      marker.setZIndexOffset(isSelected ? SELECTED_Z_OFFSET : 0);
    });
  }, []);

  // 创建地图 + 底图（StrictMode 双挂载幂等：cleanup 里 remove/dispose）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      worldCopyJump: true,
      preferCanvas: true,
    });
    mapRef.current = map;
    if (import.meta.env.DEV) {
      // 仅开发/验证期暴露：供 E2E 脚本精确 setView/setZoom 截图（生产构建被剔除）
      (window as unknown as Record<string, unknown>).__openanMap = map;
    }

    const handle = createBasemap(map, {
      mode: basemap ?? ENV_BASEMAP,
      tileUrl: ENV_TILE_URL,
      worldGeoUrl: WORLD_GEO_URL,
      onTileUnavailable: () => setTileUnavailable(true),
    });
    basemapRef.current = handle;

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;

    const handleMapClick = (event: L.LeafletMouseEvent) => {
      if (pickModeRef.current) {
        onPickRef.current?.({ longitude: event.latlng.lng, latitude: event.latlng.lat });
      }
    };
    map.on('click', handleMapClick);

    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) map.invalidateSize();
    });
    observer.observe(container);

    setMapReady(true);

    return () => {
      observer.disconnect();
      map.off('click', handleMapClick);
      handle.dispose();
      markersLayerRef.current = null;
      markerElementsRef.current.clear();
      map.remove();
      mapRef.current = null;
      basemapRef.current = null;
      if (import.meta.env.DEV && (window as unknown as Record<string, unknown>).__openanMap === map) {
        delete (window as unknown as Record<string, unknown>).__openanMap;
      }
      setMapReady(false);
      didFitRef.current = false;
    };
  }, [basemap]);

  // 组装标记层：layout → placements（环形展开）+ clusters（折叠/展开）
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup || !mapReady) return;

    if (lastSourceIdRef.current !== source.sourceId) {
      lastSourceIdRef.current = source.sourceId;
      didFitRef.current = false;
      setExpandedClusters(new Set());
    }

    layerGroup.clearLayers();
    markerElementsRef.current.clear();

    const markerByRef = new Map(markersRef.current.map((m) => [m.markerId, m]));

    const addPlacementMarker = (markerId: string, offsetPx: [number, number]): void => {
      const marker = markerByRef.get(markerId);
      if (!marker) return;
      const icon = buildMarkerIcon(
        marker,
        ratiosRef.current[marker.markerId],
        brokenRef.current.has(marker.markerId),
        offsetPx,
      );
      const leafletMarker = L.marker([marker.latitude, marker.longitude], {
        icon,
        keyboard: true,
        alt: marker.label,
        riseOnHover: true,
      });
      leafletMarker.on('click', () => onSelectRef.current?.(marker.markerId));
      leafletMarker.addTo(layerGroup);
      markerElementsRef.current.set(marker.markerId, leafletMarker);
    };

    for (const placement of layout.placements) {
      addPlacementMarker(placement.markerId, placement.offsetPx);
    }

    for (const cluster of layout.clusters) {
      const clusterMarkers = cluster.markerIds
        .map((id) => markerByRef.get(id))
        .filter((m): m is NonNullable<typeof m> => m != null);

      if (expandedClustersRef.current.has(cluster.clusterId)) {
        for (const placement of layoutExpandedCluster(clusterMarkers)) {
          addPlacementMarker(placement.markerId, placement.offsetPx);
        }
      } else {
        const clusterIcon = buildClusterIcon(
          cluster.markerIds.length,
          `${cluster.markerIds.length}${MAP_COPY.clusterCount}`,
        );
        const clusterMarker = L.marker([cluster.latitude, cluster.longitude], {
          icon: clusterIcon,
          keyboard: true,
          riseOnHover: true,
        });
        clusterMarker.on('click', () => {
          const current = mapRef.current;
          if (current) {
            const targetZoom = Math.max(current.getZoom() + 3, 6);
            current.flyTo([cluster.latitude, cluster.longitude], targetZoom, { duration: 0.6 });
          }
          setExpandedClusters((prev) => new Set(prev).add(cluster.clusterId));
        });
        clusterMarker.addTo(layerGroup);
      }
    }

    applySelection(selectedRef.current);

    if (!didFitRef.current) {
      didFitRef.current = true;
      fitToMarkers();
    }
  }, [mapReady, layout, brokenLogos, logoRatios, expandedClusters, source.sourceId, applySelection, fitToMarkers]);

  // 选中态变化 → 高亮对应标记（不重建地图）
  useEffect(() => {
    applySelection(selectedMarkerId);
  }, [selectedMarkerId, applySelection]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);
  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);
  const handleFit = useCallback(() => {
    fitToMarkers();
  }, [fitToMarkers]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1b]">
      <div
        ref={containerRef}
        role="group"
        aria-label={ariaLabel}
        className={cn('openan-map w-full', pickMode && 'openan-map--picking')}
        style={{ height }}
      />

      {/* 空态 */}
      {!hasMarkers && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-slate-400">{MAP_COPY.empty}</p>
        </div>
      )}

      {/* pickMode 顶部提示 */}
      {pickMode && (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[calc(100%-7rem)] rounded-lg border border-accent-400/40 bg-ink-900/90 px-3 py-1.5 text-xs text-accent-300 backdrop-blur-sm">
          {MAP_COPY.pickHint}
        </div>
      )}

      {/* 瓦片不可用非阻塞提示（不弹错误页、不白屏） */}
      {tileUnavailable && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] flex justify-center p-3">
          <span className="rounded-lg border border-amber-400/30 bg-ink-900/90 px-3 py-1.5 text-xs text-amber-200 backdrop-blur-sm">
            {MAP_COPY.tileUnavailable}
          </span>
        </div>
      )}

      {/* 自绘缩放按钮 */}
      {zoomControls && (
        <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1.5" role="group" aria-label={MAP_COPY.zoomReset}>
          <button type="button" onClick={handleZoomIn} aria-label={MAP_COPY.zoomIn} title={MAP_COPY.zoomIn} className={ZOOM_BTN}>
            +
          </button>
          <button type="button" onClick={handleZoomOut} aria-label={MAP_COPY.zoomOut} title={MAP_COPY.zoomOut} className={ZOOM_BTN}>
            −
          </button>
          <button
            type="button"
            onClick={handleFit}
            aria-label={MAP_COPY.zoomReset}
            title={MAP_COPY.zoomReset}
            className={cn(ZOOM_BTN, 'text-xs')}
          >
            {MAP_COPY.fitAll}
          </button>
        </div>
      )}
    </div>
  );
}