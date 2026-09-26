import type { MapMarker } from '@/types/contract';
import { initialsOf } from '@/lib/format';

export interface CountryGroup {
  countryCode: string;
  countryName: string;
  markers: MapMarker[];
}

/** 数值坐标合法性：经纬度必须是有限数值，非法点不应被渲染到 (0,0) */
export function hasValidCoordinates(marker: MapMarker): boolean {
  return Number.isFinite(marker.longitude) && Number.isFinite(marker.latitude);
}

/** 过滤掉坐标非法的 marker，避免 ECharts 把它们画到 (0,0) */
export function validMarkers(markers: MapMarker[]): MapMarker[] {
  return markers.filter(hasValidCoordinates);
}

/** logo 缺失 / 加载失败时的首字母降级文本（与 Avatar.tsx 的 initialsOf 同源） */
export function letterFallbackOf(marker: MapMarker): string {
  return initialsOf(marker.label, marker.markerId);
}

/**
 * 供 DOM 清单按国家分组：先按 countryName 升序、再按 label 升序（稳定）。
 * 坐标非法的 marker 一并过滤。
 */
export function groupMarkersByCountry(markers: MapMarker[]): CountryGroup[] {
  const groups = new Map<string, CountryGroup>();

  for (const marker of validMarkers(markers)) {
    const key = marker.countryCode || marker.countryName;
    let group = groups.get(key);
    if (!group) {
      group = { countryCode: marker.countryCode, countryName: marker.countryName, markers: [] };
      groups.set(key, group);
    }
    group.markers.push(marker);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      markers: [...group.markers].sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort(
      (a, b) =>
        a.countryName.localeCompare(b.countryName) || a.countryCode.localeCompare(b.countryCode),
    );
}

/** 同点判定阈值（度），与 marker-layout.ts 的 SAME_POINT_EPSILON_DEG 对齐 */
const SAME_POINT_EPSILON_DEG = 1e-4;

export interface SamePointGroup {
  longitude: number;
  latitude: number;
  markers: MapMarker[];
}

/**
 * 把同一国家（调用方先按国家分组）内坐标重合的 marker 归组，
 * 供清单「N 个同点」折叠 + 展开使用（与地图环形/计数簇语义对应）。
 * 组内按 label 升序（稳定）。
 */
export function groupMarkersBySamePoint(markers: MapMarker[]): SamePointGroup[] {
  const groups: SamePointGroup[] = [];
  const assigned = new Set<string>();

  for (const marker of markers) {
    if (assigned.has(marker.markerId)) continue;
    const peers = markers
      .filter(
        (m) =>
          !assigned.has(m.markerId) &&
          Math.abs(m.longitude - marker.longitude) < SAME_POINT_EPSILON_DEG &&
          Math.abs(m.latitude - marker.latitude) < SAME_POINT_EPSILON_DEG,
      )
      .sort((a, b) => a.label.localeCompare(b.label));
    peers.forEach((m) => assigned.add(m.markerId));
    groups.push({ longitude: marker.longitude, latitude: marker.latitude, markers: peers });
  }

  return groups;
}
