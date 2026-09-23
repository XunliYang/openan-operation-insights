import type { EChartsCoreOption } from '@/lib/echarts';
import { TOOLTIP_BASE } from '@/lib/chart-theme';
import type { MapMarker } from '@/types/contract';
import { MAP_COPY } from './map-copy';
import { letterFallbackOf } from './markers';

/** logo 默认宽高比（横版 3:1，与 Avatar 的 aspect-[3/1] 一致），用于尚未测得真实比例时 */
const DEFAULT_LOGO_RATIO = 3;
const LOGO_HEIGHT = 20;
const LOGO_MAX_WIDTH = 84;
const FALLBACK_SIZE = 26;

/** 标记点击回调携带的原始数据形状（tooltip / click 共用） */
export interface MarkerMapDatum {
  name: string;
  value: [number, number];
  markerId: string;
  countryName: string;
  locationLabel?: string;
  description?: string;
  symbol: string;
  symbolSize: number | [number, number];
  itemStyle?: Record<string, unknown>;
  label?: Record<string, unknown>;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/** 按 logo 真实宽高比计算 symbol 尺寸（避免一律正方形导致 logo 变形） */
function logoSymbolSize(ratio: number | undefined): [number, number] {
  const safe = Number.isFinite(ratio) && (ratio as number) > 0 ? (ratio as number) : DEFAULT_LOGO_RATIO;
  const width = Math.min(Math.round(LOGO_HEIGHT * safe), LOGO_MAX_WIDTH);
  return [Math.max(width, 16), LOGO_HEIGHT];
}

/**
 * 组装 MarkerMap 的 ECharts option（不含选中态——选中通过 dispatchAction('highlight') 驱动，
 * 避免重建 option 导致 roam/缩放被重置）。
 */
export function buildMarkerMapOption(
  markers: MapMarker[],
  brokenLogos: ReadonlySet<string>,
  logoRatios: Readonly<Record<string, number>>,
): EChartsCoreOption {
  const data: MarkerMapDatum[] = markers.map((marker) => {
    const logoUrl = marker.logoUrl?.trim();
    const useFallback = !logoUrl || brokenLogos.has(marker.markerId);

    const datum: MarkerMapDatum = {
      name: marker.label,
      value: [marker.longitude, marker.latitude],
      markerId: marker.markerId,
      countryName: marker.countryName,
      locationLabel: marker.locationLabel,
      description: marker.description,
      symbol: 'circle',
      symbolSize: FALLBACK_SIZE,
    };

    if (useFallback) {
      datum.symbol = 'circle';
      datum.symbolSize = FALLBACK_SIZE;
      datum.itemStyle = {
        color: '#4b96ff',
        borderColor: 'rgba(255,255,255,0.55)',
        borderWidth: 1.5,
        shadowBlur: 10,
        shadowColor: 'rgba(75,150,255,0.55)',
      };
      datum.label = {
        show: true,
        position: 'inside',
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 600,
        formatter: letterFallbackOf(marker),
      };
    } else {
      datum.symbol = `image://${logoUrl}`;
      datum.symbolSize = logoSymbolSize(logoRatios[marker.markerId]);
      datum.label = { show: false };
    }

    return datum;
  });

  return {
    backgroundColor: 'transparent',
    geo: {
      map: 'world',
      roam: true,
      zoom: 1.15,
      scaleLimit: { min: 0.7, max: 8 },
      itemStyle: {
        areaColor: 'rgba(30,41,59,0.38)',
        borderColor: 'rgba(148,163,184,0.38)',
        borderWidth: 0.6,
      },
      emphasis: {
        itemStyle: { areaColor: 'rgba(75,150,255,0.20)' },
        label: { show: false },
      },
    },
    tooltip: {
      ...TOOLTIP_BASE,
      trigger: 'item',
      formatter: (params: unknown) => {
        const marker = (params as { data?: MarkerMapDatum }).data;
        if (!marker) return '';
        const lines = [`<b style="font-size:13px">${escapeHtml(marker.name)}</b>`];
        if (marker.countryName) lines.push(`${MAP_COPY.tooltipCountry}：${escapeHtml(marker.countryName)}`);
        if (marker.locationLabel) lines.push(`${MAP_COPY.tooltipLocation}：${escapeHtml(marker.locationLabel)}`);
        if (marker.description) lines.push(escapeHtml(marker.description));
        return lines.join('<br/>');
      },
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        data,
        emphasis: {
          scale: 1.4,
          itemStyle: {
            borderColor: '#3fdcc6',
            borderWidth: 2,
            shadowBlur: 16,
            shadowColor: 'rgba(63,220,198,0.5)',
          },
        },
        animationDuration: 500,
        animationEasing: 'cubicOut',
      },
    ],
  };
}
