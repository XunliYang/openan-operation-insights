import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  echarts,
  type ECharts,
  type EChartsCoreOption,
  type EChartsEventHandler,
} from '@/lib/echarts';
import type { MapSource } from '@/types/contract';
import { MAP_COPY } from './map-copy';
import { buildMarkerMapOption } from './marker-map-option';
import { hasValidCoordinates } from './markers';

export interface MarkerMapProps {
  /** 组件不感知 scenario 语义，只认 MapSource 形状 */
  source: MapSource;
  height?: number | string;
  /** 由页面持有，支持清单↔地图联动 */
  selectedMarkerId?: string | null;
  onSelectMarker?: (markerId: string) => void;
  ariaLabel?: string;
}

type GeoStatus = 'loading' | 'ready' | 'error';

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const WORLD_GEO_URL = `${BASE_URL}/map/world.json`;

/** 模块级缓存：world.json 只 fetch 一次，多个实例共享；registerMap 本身幂等 */
let worldGeoPromise: Promise<unknown> | null = null;

function loadWorldGeoJson(): Promise<unknown> {
  if (!worldGeoPromise) {
    worldGeoPromise = fetch(WORLD_GEO_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .catch((error) => {
        worldGeoPromise = null; // 失败后允许重试
        throw error;
      });
  }
  return worldGeoPromise;
}

/**
 * 可复用地理标记地图：输入 MapSource，输出带 logo 标记的世界地图。
 * - 深色底 + 浅色轮廓 + brand/accent 强调（GeoComponent + ScatterChart）
 * - logo 缺失 / 加载失败 → 圆点 + 首字母降级（与 Avatar.tsx 同源）
 * - 点击标记 → onSelectMarker；selectedMarkerId 变化 → dispatchAction 高亮（不重建 option，保留 roam）
 */
export function MarkerMap({
  source,
  height = 520,
  selectedMarkerId = null,
  onSelectMarker,
  ariaLabel = source.name,
}: MarkerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('loading');
  const [retryToken, setRetryToken] = useState(0);
  const [brokenLogos, setBrokenLogos] = useState<ReadonlySet<string>>(new Set());
  const [logoRatios, setLogoRatios] = useState<Readonly<Record<string, number>>>({});

  const markers = useMemo(() => source.markers.filter(hasValidCoordinates), [source.markers]);
  const hasMarkers = markers.length > 0;

  // 最新值 ref：供稳定的图表回调读取，避免闭包过期
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const selectedRef = useRef(selectedMarkerId);
  selectedRef.current = selectedMarkerId;

  // 加载 world.json 并注册（registerMap 幂等，重复注册不会报错）
  useEffect(() => {
    let cancelled = false;
    setGeoStatus('loading');
    loadWorldGeoJson()
      .then((geoJson) => {
        if (cancelled) return;
        echarts.registerMap('world', geoJson as Parameters<typeof echarts.registerMap>[1]);
        setGeoStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setGeoStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  // 预加载 logo：探测加载失败 + 测量真实宽高比
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

  const option = useMemo<EChartsCoreOption>(
    () => buildMarkerMapOption(markers, brokenLogos, logoRatios),
    [markers, brokenLogos, logoRatios],
  );

  const applySelection = useCallback((chart: ECharts) => {
    if (chart.isDisposed()) return;
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
    const selected = selectedRef.current;
    if (!selected) return;
    const index = markersRef.current.findIndex((marker) => marker.markerId === selected);
    if (index >= 0) {
      chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: index });
    }
  }, []);

  // 初始化 / 销毁图表（镜像 EChart 的 ResizeObserver + dispose 写法）
  useEffect(() => {
    if (geoStatus !== 'ready' || !hasMarkers) return;
    const container = containerRef.current;
    if (!container) return;

    const chart = echarts.init(container, undefined, { renderer: 'canvas' });
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (!chart.isDisposed()) chart.resize();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [geoStatus, hasMarkers]);

  // 应用 option（整体替换），并恢复选中态。
  // 依赖 geoStatus/hasMarkers：确保图表在 init 之后立即拿到 option，避免空画布。
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(option, true);
    applySelection(chart);
  }, [option, applySelection, geoStatus, hasMarkers]);

  // 选中态变化 → 高亮对应标记
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) applySelection(chart);
  }, [selectedMarkerId, applySelection]);

  // 点击标记 → 上报 markerId（参考 EChart 的订阅/解绑写法）
  const handleClick = useCallback<EChartsEventHandler>(
    (params) => {
      const markerId = (params as { data?: { markerId?: string } }).data?.markerId;
      if (markerId) onSelectMarker?.(markerId);
    },
    [onSelectMarker],
  );

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onSelectMarker) return;
    chart.on('click', handleClick);
    return () => {
      chart.off('click', handleClick);
    };
  }, [handleClick, geoStatus, hasMarkers]);

  return (
    <div className={cn('relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1b]')}>
      {geoStatus === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3" style={{ height }}>
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-brand-400" />
          <span className="text-sm text-slate-400">{MAP_COPY.loading}</span>
        </div>
      )}

      {geoStatus === 'error' && (
        <div className="flex flex-col items-center justify-center gap-4" style={{ height }}>
          <p className="text-sm font-medium text-rose-200">{MAP_COPY.registerFailed}</p>
          <button
            type="button"
            onClick={() => setRetryToken((token) => token + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/[0.09]"
          >
            {MAP_COPY.retry}
          </button>
        </div>
      )}

      {geoStatus === 'ready' && !hasMarkers && (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-sm text-slate-400">{MAP_COPY.empty}</p>
        </div>
      )}

      {geoStatus === 'ready' && hasMarkers && (
        <div ref={containerRef} role="img" aria-label={ariaLabel} className="w-full" style={{ height }} />
      )}
    </div>
  );
}
