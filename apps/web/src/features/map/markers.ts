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
