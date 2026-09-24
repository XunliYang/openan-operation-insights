import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Badge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { AsyncState } from '@/components/ui/AsyncState';
import { Avatar } from '@/components/ui/Avatar';
import { Segmented, type SegmentedOption } from '@/components/ui/Segmented';
import { IconExternal, IconFile, IconPin } from '@/components/icons';
import { MarkerMap } from '@/features/map/MarkerMap';
import { groupMarkersByCountry } from '@/features/map/markers';
import { MAP_COPY } from '@/features/map/map-copy';
import { useMapSource, useMapSources } from '@/hooks/useMapSources';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { MapSource } from '@/types/contract';

/** 默认数据源：生态参与者（S1 种子 source 之一，另一为 summit-attendees） */
const DEFAULT_SOURCE_ID = 'ecosystem-participants';

/**
 * data/map-sources.manual.json 的条目结构示例。
 * 字段名与 S1 契约 MapMarker（markerId/label/logoUrl/homepageUrl/countryCode/countryName/
 * longitude/latitude/locationLabel/group/orgId/description/origin）外加 sourceId 逐一对齐；
 * origin 由后端合并逻辑统一写入 'manual'，此处声明值仅作占位。
 */
const MANUAL_ENTRY_TEMPLATE = `{
  "schemaVersion": 1,
  "updatedAt": "2026-09-23T00:00:00Z",
  "data": [
    {
      "sourceId": "ecosystem-participants",
      "markerId": "example-participant",
      "label": "Example Participant",
      "logoUrl": "/logos/example.png",
      "homepageUrl": "https://example.com",
      "countryCode": "CN",
      "countryName": "China",
      "longitude": 116.4,
      "latitude": 39.9,
      "locationLabel": "Beijing, China",
      "group": "participant",
      "orgId": "example-participant",
      "description": "",
      "origin": "manual"
    }
  ]
}`;

/**
 * 生态地图页（路由 /ecosystem）：把可复用 MarkerMap 组装成真实可达页面。
 * - 单状态源 selectedMarkerId 驱动地图高亮与清单选中，两侧不做各自 setState；
 * - 地图（canvas）读屏/键盘不可达，故并排渲染一份按国家分组的 DOM 清单兜底；
 * - 口径与「手动添加」字段模板与 data/map-sources.manual.json 实际结构一致。
 */
export function EcosystemMapPage() {
  const sourcesQuery = useMapSources();
  const [sourceId, setSourceId] = useState<string>(DEFAULT_SOURCE_ID);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const sourceQuery = useMapSource(sourceId);

  /** 地图↔清单联动：清单项 DOM 引用，供地图点击后滚动到可视区 */
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  const sourceOptions = useMemo<Array<SegmentedOption<string>>>(
    () =>
      (sourcesQuery.data ?? []).map((source) => ({
        value: source.sourceId,
        label: source.name,
        count: source.markerCount,
      })),
    [sourcesQuery.data],
  );

  const markers = useMemo(() => sourceQuery.data?.markers ?? [], [sourceQuery.data]);
  const groups = useMemo(() => groupMarkersByCountry(markers), [markers]);

  const handleSourceChange = useCallback((next: string) => {
    setSourceId(next);
    setSelectedMarkerId(null);
  }, []);

  const handleSelectMarker = useCallback((markerId: string) => {
    setSelectedMarkerId(markerId);
  }, []);

  // 选中项变化时（尤其来自地图点击）把对应清单项滚动到可视区
  useEffect(() => {
    if (!selectedMarkerId) return;
    itemRefs.current.get(selectedMarkerId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedMarkerId]);

  const source: MapSource | undefined = sourceQuery.data;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={MAP_COPY.pageEyebrow}
        title={MAP_COPY.pageTitle}
        description={MAP_COPY.pageDescription}
        meta={
          <>
            <Badge tone="brand">{MAP_COPY.readonlyView}</Badge>
            {source ? (
              <span className="text-xs text-slate-500">
                {MAP_COPY.updatedAt} {formatDateTime(source.updatedAt)}
              </span>
            ) : null}
          </>
        }
      />

      {/* ── 数据源切换（同一地图组件复用于生态/参会场景） ── */}
      {sourceOptions.length > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-400">{MAP_COPY.sourceSwitch}</span>
          <Segmented options={sourceOptions} value={sourceId} onChange={handleSourceChange} />
        </div>
      ) : null}

      {/* ── 地图 + 参与方清单（桌面并排 / 移动纵排） ── */}
      <AsyncState
        isLoading={sourceQuery.isLoading}
        isError={sourceQuery.isError}
        error={sourceQuery.error}
        onRetry={() => void sourceQuery.refetch()}
        skeleton={
          <div className="h-[clamp(320px,58vh,640px)] animate-pulse rounded-2xl border border-white/10 bg-white/[0.02]" />
        }
      >
        {source ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="min-w-0 lg:col-span-3">
              <MarkerMap
                source={source}
                selectedMarkerId={selectedMarkerId}
                onSelectMarker={handleSelectMarker}
                ariaLabel={`${MAP_COPY.pageTitle} · ${source.name}`}
              />
            </div>

            <div className="lg:col-span-2">
              <Card className="reveal flex flex-col lg:h-[520px]">
                <CardTitle
                  title={MAP_COPY.listTitle}
                  description={MAP_COPY.listHint}
                  icon={<IconPin width={16} height={16} />}
                />
                <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
                  {groups.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">{MAP_COPY.empty}</p>
                  ) : (
                    <ul role="list" className="space-y-4">
                      {groups.map((group) => (
                        <li key={group.countryCode || group.countryName}>
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                              {group.countryName}
                            </span>
                            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[0.68rem] tabular-nums text-slate-400">
                              {group.markers.length}
                            </span>
                          </div>
                          <ul role="list" className="mt-1.5 space-y-0.5">
                            {group.markers.map((marker) => {
                              const selected = marker.markerId === selectedMarkerId;
                              return (
                                <li
                                  key={marker.markerId}
                                  ref={(el) => {
                                    if (el) itemRefs.current.set(marker.markerId, el);
                                    else itemRefs.current.delete(marker.markerId);
                                  }}
                                  className={cn(
                                    'flex items-center gap-1 rounded-xl border transition-colors',
                                    selected
                                      ? 'border-accent-400/50 bg-accent-500/[0.08]'
                                      : 'border-transparent hover:bg-white/[0.03]',
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleSelectMarker(marker.markerId)}
                                    aria-pressed={selected}
                                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
                                  >
                                    <Avatar
                                      src={marker.logoUrl}
                                      name={marker.label}
                                      fallbackId={marker.markerId}
                                      size="sm"
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span
                                        className={cn(
                                          'block truncate text-sm font-medium',
                                          selected ? 'text-accent-200' : 'text-white',
                                        )}
                                      >
                                        {marker.label}
                                      </span>
                                      <span className="block truncate text-xs text-slate-400">
                                        {marker.locationLabel || marker.countryName}
                                      </span>
                                    </span>
                                  </button>
                                  {marker.homepageUrl ? (
                                    <a
                                      href={marker.homepageUrl}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      aria-label={`${marker.label} · ${MAP_COPY.homepageLabel}`}
                                      className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
                                    >
                                      <IconExternal width={14} height={14} />
                                    </a>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </AsyncState>

      {/* ── 口径与「手动添加」说明 ─────────────────────── */}
      <section aria-label={MAP_COPY.addTitle}>
        <Card className="reveal">
          <CardTitle
            title={MAP_COPY.addTitle}
            description={MAP_COPY.addBody}
            icon={<IconFile width={16} height={16} />}
          />
          <div className="mt-5 space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
              {MAP_COPY.addTemplateHint}
            </p>
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a0e1b] p-4 text-xs leading-relaxed text-slate-300">
              <code>{MANUAL_ENTRY_TEMPLATE}</code>
            </pre>
          </div>
        </Card>
      </section>
    </div>
  );
}