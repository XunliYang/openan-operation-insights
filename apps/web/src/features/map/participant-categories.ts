import type { MapMarker, ParticipantCategory } from '@/types/contract';
import type { BadgeTone } from '@/components/ui/Badge';
import { PARTICIPANT_COPY } from './participant-copy';

/**
 * 参与方分类口径单一收口（ADR-0009）：六个展示分区固定顺序。
 * `category === 'other'` 的条目由调用方用 `uncategorizedMarkers` 归入「未分类」区，
 * 排在六区之后（视觉上单独一段）。
 */
export const PARTICIPANT_CATEGORIES = [
  'operator',
  'equipment-vendor',
  'integrator',
  'it-vendor',
  'cloud-vendor',
  'research',
] as const;

export type DisplayCategory = (typeof PARTICIPANT_CATEGORIES)[number];

/** 六类 + other 的中文标签（引自 participant-copy）与徽章配色 */
export const CATEGORY_META: Record<ParticipantCategory, { label: string; tone: BadgeTone }> = {
  operator: { label: PARTICIPANT_COPY.categoryOperator, tone: 'brand' },
  'equipment-vendor': { label: PARTICIPANT_COPY.categoryEquipmentVendor, tone: 'violet' },
  integrator: { label: PARTICIPANT_COPY.categoryIntegrator, tone: 'accent' },
  'it-vendor': { label: PARTICIPANT_COPY.categoryItVendor, tone: 'amber' },
  'cloud-vendor': { label: PARTICIPANT_COPY.categoryCloudVendor, tone: 'rose' },
  research: { label: PARTICIPANT_COPY.categoryResearch, tone: 'neutral' },
  other: { label: PARTICIPANT_COPY.categoryOther, tone: 'neutral' },
};

export function isDisplayCategory(value: ParticipantCategory): value is DisplayCategory {
  return (PARTICIPANT_CATEGORIES as readonly string[]).includes(value);
}

/** 六个展示分区（固定顺序），每区条目按 label 升序；'other' 不在其中 */
export function groupByCategory(
  markers: MapMarker[],
): Array<{ category: DisplayCategory; markers: MapMarker[] }> {
  const buckets: Array<{ category: DisplayCategory; markers: MapMarker[] }> =
    PARTICIPANT_CATEGORIES.map((category) => ({ category, markers: [] }));
  const byCategory = new Map(buckets.map((bucket) => [bucket.category, bucket]));

  for (const marker of markers) {
    if (isDisplayCategory(marker.category)) {
      byCategory.get(marker.category)?.markers.push(marker);
    }
  }

  for (const bucket of buckets) {
    bucket.markers.sort((a, b) => a.label.localeCompare(b.label));
  }
  return buckets;
}

/** 未分类条目（category === 'other'），渲染在六区之后；按 label 升序 */
export function uncategorizedMarkers(markers: MapMarker[]): MapMarker[] {
  return markers
    .filter((marker) => !isDisplayCategory(marker.category))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** 表单 / 筛选下拉选项（六类 + 未分类） */
export function categoryOptions(): Array<{ value: ParticipantCategory; label: string }> {
  return [
    ...PARTICIPANT_CATEGORIES.map((category) => ({
      value: category,
      label: CATEGORY_META[category].label,
    })),
    { value: 'other', label: CATEGORY_META.other.label },
  ];
}
