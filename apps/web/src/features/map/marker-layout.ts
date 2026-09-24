import type { MapMarker } from '@/types/contract';

/**
 * logo 去重叠布局（纯函数深模块，无 DOM / Leaflet / ECharts 依赖，可脱离浏览器验证）。
 *
 * 规则（ADR-0007）：
 * 1. 坐标相同的 marker（距离 < 1e-4 度视为同点）分为一组；
 * 2. 组内按 markerId 升序，绕同点小圆环均分角度，得到像素偏移 offsetPx；
 * 3. 环形半径取 `2πr ≥ Σ(iconWidth + gap)` 的保守下界并 clamp；
 * 4. 若组内过多、半径触到 maxRadiusPx 仍放不下 → 退化为计数簇（MarkerCluster）。
 *
 * 真实经纬度始终不变：偏移只发生在像素空间，任何缩放级别都不重叠，悬停仍显示真实地点。
 */

export interface MarkerPlacement {
  markerId: string;
  longitude: number;
  latitude: number;
  /** 像素级偏移（环形展开），经 divIcon 内层 transform: translate 应用 */
  offsetPx: [number, number];
}

export interface MarkerCluster {
  clusterId: string;
  longitude: number;
  latitude: number;
  markerIds: string[];
}

export interface MarkerLayout {
  placements: MarkerPlacement[];
  clusters: MarkerCluster[];
}

export interface MarkerLayoutOptions {
  ringGapPx?: number;
  minRadiusPx?: number;
  maxRadiusPx?: number;
}

/** 同点判定阈值（度） */
const SAME_POINT_EPSILON_DEG = 1e-4;
/** 单个 logo 图标的最大像素占宽（与 marker-icons.ts 的 LOGO_MAX_WIDTH 对齐）。
 *  作为环形间距的保守上界：任意真实 logo 宽度下相邻图标都不会重叠。 */
const LOGO_FOOTPRINT_WIDTH_PX = 72;

const DEFAULT_RING_GAP_PX = 6;
const DEFAULT_MIN_RADIUS_PX = 26;
const DEFAULT_MAX_RADIUS_PX = 88;

function samePoint(a: MapMarker, b: MapMarker): boolean {
  return (
    Math.abs(a.longitude - b.longitude) < SAME_POINT_EPSILON_DEG &&
    Math.abs(a.latitude - b.latitude) < SAME_POINT_EPSILON_DEG
  );
}

function ringOffset(index: number, count: number, radius: number): [number, number] {
  // 从正上方开始顺时针均分
  const angle = (2 * Math.PI * index) / count - Math.PI / 2;
  return [Math.round(radius * Math.cos(angle)), Math.round(radius * Math.sin(angle))];
}

function placeRing(
  longitude: number,
  latitude: number,
  markerIds: string[],
  radius: number,
): MarkerPlacement[] {
  return markerIds.map((markerId, index) => ({
    markerId,
    longitude,
    latitude,
    offsetPx: ringOffset(index, markerIds.length, radius),
  }));
}

export function layoutMarkers(
  markers: MapMarker[],
  opts: MarkerLayoutOptions = {},
): MarkerLayout {
  const gap = opts.ringGapPx ?? DEFAULT_RING_GAP_PX;
  const minRadius = opts.minRadiusPx ?? DEFAULT_MIN_RADIUS_PX;
  const maxRadius = opts.maxRadiusPx ?? DEFAULT_MAX_RADIUS_PX;

  const groups: Array<{ longitude: number; latitude: number; markerIds: string[] }> = [];
  const assigned = new Set<string>();

  for (const marker of markers) {
    if (assigned.has(marker.markerId)) continue;
    const ids = markers
      .filter((m) => !assigned.has(m.markerId) && samePoint(marker, m))
      .map((m) => m.markerId)
      .sort();
    ids.forEach((id) => assigned.add(id));
    groups.push({ longitude: marker.longitude, latitude: marker.latitude, markerIds: ids });
  }

  const placements: MarkerPlacement[] = [];
  const clusters: MarkerCluster[] = [];

  for (const group of groups) {
    const count = group.markerIds.length;

    if (count === 1) {
      placements.push({
        markerId: group.markerIds[0],
        longitude: group.longitude,
        latitude: group.latitude,
        offsetPx: [0, 0],
      });
      continue;
    }

    const required = (count * (LOGO_FOOTPRINT_WIDTH_PX + gap)) / (2 * Math.PI);
    if (required > maxRadius) {
      clusters.push({
        clusterId: group.markerIds[0],
        longitude: group.longitude,
        latitude: group.latitude,
        markerIds: group.markerIds,
      });
      continue;
    }

    const radius = Math.min(Math.max(required, minRadius), maxRadius);
    placements.push(...placeRing(group.longitude, group.latitude, group.markerIds, radius));
  }

  return { placements, clusters };
}

/**
 * 把一组同点 marker 强制展开为环形（供簇点击 flyTo 放大后的「展开」态使用）。
 * 与 layoutMarkers 的区别：不做「放不下 → 簇」退化，半径允许超过 maxRadiusPx（已放大）。
 */
export function layoutExpandedCluster(
  markers: MapMarker[],
  opts: MarkerLayoutOptions = {},
): MarkerPlacement[] {
  const gap = opts.ringGapPx ?? DEFAULT_RING_GAP_PX;
  const minRadius = opts.minRadiusPx ?? DEFAULT_MIN_RADIUS_PX;

  if (markers.length === 0) return [];

  const longitude = markers[0].longitude;
  const latitude = markers[0].latitude;
  const ids = markers.map((m) => m.markerId).sort();
  const required = (ids.length * (LOGO_FOOTPRINT_WIDTH_PX + gap)) / (2 * Math.PI);
  const radius = Math.max(required, minRadius);

  return placeRing(longitude, latitude, ids, radius);
}