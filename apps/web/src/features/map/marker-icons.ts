import * as L from 'leaflet';
import type { MapMarker } from '@/types/contract';
import { letterFallbackOf } from './markers';

/** logo 图标宽度上限（与 marker-layout.ts 的 LOGO_FOOTPRINT_WIDTH_PX 对齐） */
export const LOGO_MAX_WIDTH = 72;
export const LOGO_HEIGHT = 22;
/** 缺 logo / 加载失败时的圆形首字母徽标半径 */
const FALLBACK_RADIUS = 13;
/** 尚未测得真实宽高比时的默认横版比例（3:1，与 Avatar 一致） */
const DEFAULT_LOGO_RATIO = 3;

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

function logoWidth(ratio: number | undefined): number {
  const safe = Number.isFinite(ratio) && (ratio as number) > 0 ? (ratio as number) : DEFAULT_LOGO_RATIO;
  return Math.min(Math.round(LOGO_HEIGHT * safe), LOGO_MAX_WIDTH);
}

function hoverTitle(marker: MapMarker): string {
  const location = marker.locationLabel?.trim() || marker.countryName?.trim();
  return location ? `${marker.label} · ${location}` : marker.label;
}

/**
 * 构造单个 marker 的 L.DivIcon。
 * - 有 logo（且未标记 broken）：`<img>` 图标，宽度按真实宽高比、上限 72×22；
 * - 缺 logo / 加载失败：圆形首字母徽标（与 Avatar / letterFallbackOf 同源），半径 13；
 * - 选中态外圈 `#3fdcc6` 描边（由组件经 `.is-selected` 类切换，见 map.css）。
 *
 * `offsetPx` 通过内层 `transform: translate()` 实现像素级固定偏移，缩放不散架。
 */
export function buildMarkerIcon(
  marker: MapMarker,
  logoRatio: number | undefined,
  broken: boolean,
  offsetPx: [number, number] = [0, 0],
): L.DivIcon {
  const logoUrl = marker.logoUrl?.trim();
  const useFallback = !logoUrl || broken;
  const [dx, dy] = offsetPx;
  const shiftStyle = `transform:translate(${dx}px,${dy}px);will-change:transform;`;
  const title = escapeHtml(hoverTitle(marker));

  let content: string;
  let size: [number, number];

  if (useFallback) {
    const diameter = FALLBACK_RADIUS * 2;
    size = [diameter, diameter];
    content = `<span class="openan-marker-badge" title="${title}">${escapeHtml(letterFallbackOf(marker))}</span>`;
  } else {
    const width = logoWidth(logoRatio);
    size = [width, LOGO_HEIGHT];
    content =
      `<span class="openan-marker-logo" title="${title}">` +
      `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(marker.label)}" width="${width}" height="${LOGO_HEIGHT}" draggable="false" loading="eager" />` +
      `</span>`;
  }

  return L.divIcon({
    className: 'openan-marker-icon',
    html: `<div class="openan-marker-shift" style="${shiftStyle}">${content}</div>`,
    iconSize: size,
    iconAnchor: [Math.round(size[0] / 2), Math.round(size[1] / 2)],
  });
}

/**
 * 计数簇的 DivIcon（环形放不下的同点组折叠为「N」徽标）。
 * 点击簇 → 组件 flyTo 放大并展开为各 marker 的环形布局。
 */
export function buildClusterIcon(count: number, title: string): L.DivIcon {
  const diameter = 30;
  return L.divIcon({
    className: 'openan-marker-icon',
    html: `<div class="openan-marker-shift"><span class="openan-marker-cluster" title="${title}">${count}</span></div>`,
    iconSize: [diameter, diameter],
    iconAnchor: [diameter / 2, diameter / 2],
  });
}