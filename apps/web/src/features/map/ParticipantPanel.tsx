import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Field';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { IconPin, IconPlus } from '@/components/icons';
import { cn } from '@/lib/cn';
import type { MapMarker, MapSource } from '@/types/contract';
import { CATEGORY_META, categoryOptions, groupByCategory, uncategorizedMarkers } from './participant-categories';
import { groupMarkersByCountry, groupMarkersBySamePoint } from './markers';
import { PARTICIPANT_COPY } from './participant-copy';
import { ParticipantCard } from './ParticipantCard';

export interface ParticipantPanelProps {
  source: MapSource;
  writable: boolean;
  selectedMarkerId: string | null;
  onSelectMarker: (markerId: string) => void;
  onEdit: (marker: MapMarker) => void;
  onDelete: (marker: MapMarker) => void;
  onAdd: () => void;
}

interface CardSharedProps {
  selectedMarkerId: string | null;
  writable: boolean;
  onSelectMarker: (markerId: string) => void;
  onEdit: (marker: MapMarker) => void;
  onDelete: (marker: MapMarker) => void;
  registerRef: (markerId: string) => (el: HTMLLIElement | null) => void;
}

const samePointKey = (countryKey: string, longitude: number, latitude: number) =>
  `${countryKey}:${longitude.toFixed(5)}:${latitude.toFixed(5)}`;

/** 分区标题 + 计数徽章；空态显示「暂无」 */
function CategorySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 px-1 pb-1.5">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.68rem] tabular-nums text-slate-400">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="px-1 py-2 text-xs text-slate-600">{PARTICIPANT_COPY.empty}</p>
      ) : (
        children
      )}
    </section>
  );
}

/** 分区内的国家次级分组 + 同点去重（「N 个同点」折叠/展开） */
function MarkerList({ markers, ...shared }: { markers: MapMarker[] } & CardSharedProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const countries = useMemo(() => groupMarkersByCountry(markers), [markers]);

  // 标记 → 其同点组 key：用于地图选中同点组内非首位成员时自动展开
  const markerToGroupKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const country of countries) {
      const countryKey = country.countryCode || country.countryName;
      for (const group of groupMarkersBySamePoint(country.markers)) {
        if (group.markers.length <= 1) continue;
        const key = samePointKey(countryKey, group.longitude, group.latitude);
        for (const marker of group.markers) map.set(marker.markerId, key);
      }
    }
    return map;
  }, [countries]);

  useEffect(() => {
    const key = shared.selectedMarkerId
      ? markerToGroupKey.get(shared.selectedMarkerId)
      : undefined;
    if (key) setExpanded((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, [shared.selectedMarkerId, markerToGroupKey]);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderCard = (marker: MapMarker) => (
    <ParticipantCard
      key={marker.markerId}
      marker={marker}
      selected={marker.markerId === shared.selectedMarkerId}
      writable={shared.writable}
      onSelect={shared.onSelectMarker}
      onEdit={shared.onEdit}
      onDelete={shared.onDelete}
      itemRef={shared.registerRef(marker.markerId)}
    />
  );

  return (
    <ul role="list" className="space-y-1">
      {countries.map((country) => {
        const countryKey = country.countryCode || country.countryName;
        return (
          <li key={countryKey} className="pt-0.5">
            <div className="flex items-center gap-2 px-1 py-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate-500">
                {country.countryName}
              </span>
              <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.66rem] tabular-nums text-slate-400">
                {country.markers.length}
              </span>
            </div>
            <ul role="list" className="space-y-0.5">
              {groupMarkersBySamePoint(country.markers).map((group) => {
                const key = samePointKey(countryKey, group.longitude, group.latitude);
                const isExpanded = expanded.has(key);

                if (group.markers.length === 1) {
                  return renderCard(group.markers[0]);
                }

                if (!isExpanded) {
                  return (
                    <li key={key} className="relative">
                      {renderCard(group.markers[0])}
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        aria-expanded={false}
                        className="absolute right-2 top-2 rounded-md border border-white/10 bg-ink-900/95 px-1.5 py-0.5 text-[0.68rem] text-slate-300 transition hover:border-white/25 hover:text-white"
                      >
                        {PARTICIPANT_COPY.samePointBadge(group.markers.length)}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={key} className="space-y-0.5">
                    {group.markers.map((marker) => renderCard(marker))}
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="flex w-full justify-end px-2 py-0.5 text-[0.68rem] text-slate-500 transition hover:text-slate-200"
                    >
                      {PARTICIPANT_COPY.collapse}
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

/** 「参与方清单」卡片：六类分区 + 未分类区，搜索/筛选工具条，内部滚动 */
export function ParticipantPanel({
  source,
  writable,
  selectedMarkerId,
  onSelectMarker,
  onEdit,
  onDelete,
  onAdd,
}: ParticipantPanelProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  const markers = source.markers;

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return markers.filter((marker) => {
      if (categoryFilter.length > 0 && !categoryFilter.includes(marker.category)) return false;
      if (!keyword) return true;
      return [marker.label, marker.locationLabel ?? '', marker.countryName].some((text) =>
        text.toLowerCase().includes(keyword),
      );
    });
  }, [markers, search, categoryFilter]);

  const sections = useMemo(() => groupByCategory(filtered), [filtered]);
  const uncategorized = useMemo(() => uncategorizedMarkers(filtered), [filtered]);
  const filterOptions = useMemo(() => categoryOptions(), []);

  const registerRef = useCallback((markerId: string) => (el: HTMLLIElement | null) => {
    if (el) itemRefs.current.set(markerId, el);
    else itemRefs.current.delete(markerId);
  }, []);

  // 选中项变化（含地图点击 / 新增后高亮）→ 滚动到可视区
  useEffect(() => {
    if (!selectedMarkerId) return;
    itemRefs.current.get(selectedMarkerId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedMarkerId, markers]);

  const cardShared: CardSharedProps = {
    selectedMarkerId,
    writable,
    onSelectMarker,
    onEdit,
    onDelete,
    registerRef,
  };

  return (
    <Card className="reveal flex flex-col">
      <CardTitle
        title={PARTICIPANT_COPY.panelTitle}
        description={writable ? PARTICIPANT_COPY.panelHint : PARTICIPANT_COPY.panelHintReadonly}
        icon={<IconPin width={16} height={16} />}
        action={
          <button
            type="button"
            onClick={onAdd}
            disabled={!writable}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition',
              writable
                ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500'
                : 'cursor-not-allowed border border-white/10 bg-white/[0.03] text-slate-500',
            )}
          >
            <IconPlus width={14} height={14} />
            {PARTICIPANT_COPY.addParticipant}
          </button>
        }
      />

      {/* 工具条：搜索 + 分类筛选 */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={PARTICIPANT_COPY.searchPlaceholder}
          className="sm:max-w-xs"
        />
        <MultiSelect
          options={filterOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
          placeholder={PARTICIPANT_COPY.filterCategoryPlaceholder}
          className="sm:w-56"
        />
      </div>

      {/* 内部滚动容器 */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1 max-h-[70vh]">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{PARTICIPANT_COPY.empty}</p>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <CategorySection
                key={section.category}
                title={CATEGORY_META[section.category].label}
                count={section.markers.length}
              >
                <MarkerList markers={section.markers} {...cardShared} />
              </CategorySection>
            ))}
            {uncategorized.length > 0 ? (
              <CategorySection
                title={PARTICIPANT_COPY.uncategorizedTitle}
                count={uncategorized.length}
              >
                <MarkerList markers={uncategorized} {...cardShared} />
              </CategorySection>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}