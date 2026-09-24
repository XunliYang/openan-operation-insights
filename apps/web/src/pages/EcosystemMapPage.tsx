import { useCallback, useMemo, useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Badge } from '@/components/ui/Badge';
import { AsyncState } from '@/components/ui/AsyncState';
import { Segmented, type SegmentedOption } from '@/components/ui/Segmented';
import { MarkerMap } from '@/features/map/MarkerMap';
import { MAP_COPY } from '@/features/map/map-copy';
import { PARTICIPANT_COPY } from '@/features/map/participant-copy';
import { ParticipantPanel } from '@/features/map/ParticipantPanel';
import { ParticipantEditorDialog } from '@/features/map/ParticipantEditorDialog';
import {
  useDeleteMapMarker,
  useMapCapabilities,
  useMapSource,
  useMapSources,
} from '@/hooks/useMapSources';
import { formatDateTime } from '@/lib/format';
import type { MapMarker } from '@/types/contract';

/** 默认数据源：生态参与者（种子 source 之一，另一为 summit-attendees） */
const DEFAULT_SOURCE_ID = 'ecosystem-participants';

/**
 * 生态地图页（路由 /ecosystem）：地图（左，窄）+ 可编辑参与方清单（右，主导）。
 * - 布局反转（ADR-0009）：地图 lg:col-span-2、清单 lg:col-span-3，< lg 先地图后清单；
 * - 单状态源 selectedMarkerId 驱动地图高亮与清单选中，两侧不做各自 setState；
 * - 写能力由 GET /api/maps/capabilities 决定，只读时禁用「添加参与方」并展示横幅；
 * - 页面只做编排，分区/卡片/表单/工具条都在 features/map/**。
 */
export function EcosystemMapPage() {
  const sourcesQuery = useMapSources();
  const capabilitiesQuery = useMapCapabilities();
  const [sourceId, setSourceId] = useState<string>(DEFAULT_SOURCE_ID);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; marker: MapMarker | null }>({
    open: false,
    marker: null,
  });

  const sourceQuery = useMapSource(sourceId);
  const deleteMutation = useDeleteMapMarker();

  const writable = capabilitiesQuery.data?.writable ?? false;
  const capabilitiesReady = !capabilitiesQuery.isLoading;

  const sourceOptions = useMemo<Array<SegmentedOption<string>>>(
    () =>
      (sourcesQuery.data ?? []).map((source) => ({
        value: source.sourceId,
        label: source.name,
        count: source.markerCount,
      })),
    [sourcesQuery.data],
  );

  const handleSourceChange = useCallback((next: string) => {
    setSourceId(next);
    setSelectedMarkerId(null);
  }, []);

  const handleSelectMarker = useCallback((markerId: string) => {
    setSelectedMarkerId(markerId);
  }, []);

  const handleAdd = useCallback(() => setEditor({ open: true, marker: null }), []);
  const handleEdit = useCallback((marker: MapMarker) => setEditor({ open: true, marker }), []);
  const handleCloseEditor = useCallback(() => setEditor({ open: false, marker: null }), []);
  const handleSaved = useCallback((markerId: string) => {
    setEditor({ open: false, marker: null });
    setSelectedMarkerId(markerId);
  }, []);

  const handleDelete = useCallback(
    (marker: MapMarker) => {
      if (!window.confirm(PARTICIPANT_COPY.deleteConfirm)) return;
      deleteMutation
        .mutateAsync({ sourceId, markerId: marker.markerId })
        .then(() => {
          if (selectedMarkerId === marker.markerId) setSelectedMarkerId(null);
        })
        .catch((error: unknown) => {
          window.alert(error instanceof Error ? error.message : PARTICIPANT_COPY.errDefault);
        });
    },
    [deleteMutation, sourceId, selectedMarkerId],
  );

  const source = sourceQuery.data;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={MAP_COPY.pageEyebrow}
        title={MAP_COPY.pageTitle}
        description={MAP_COPY.pageDescription}
        meta={
          <>
            {capabilitiesReady && !writable ? <Badge tone="neutral">{MAP_COPY.readonlyView}</Badge> : null}
            {source ? (
              <span className="text-xs text-slate-500">
                {MAP_COPY.updatedAt} {formatDateTime(source.updatedAt)}
              </span>
            ) : null}
          </>
        }
      />

      {/* 只读横幅：未授权/未启用写接口时提示，其余功能不受影响 */}
      {capabilitiesReady && !writable ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300">
          {MAP_COPY.readonlyBanner}
        </div>
      ) : null}

      {/* ── 数据源切换（同一地图组件复用于生态/参会场景） ── */}
      {sourceOptions.length > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-400">{MAP_COPY.sourceSwitch}</span>
          <Segmented options={sourceOptions} value={sourceId} onChange={handleSourceChange} />
        </div>
      ) : null}

      {/* ── 地图（左）+ 参与方清单（右，主导） ── */}
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
            <div className="min-w-0 lg:col-span-2">
              <MarkerMap
                source={source}
                selectedMarkerId={selectedMarkerId}
                onSelectMarker={handleSelectMarker}
                zoomControls
                ariaLabel={`${MAP_COPY.pageTitle} · ${source.name}`}
              />
            </div>

            <div className="min-w-0 lg:col-span-3">
              <ParticipantPanel
                source={source}
                writable={writable}
                selectedMarkerId={selectedMarkerId}
                onSelectMarker={handleSelectMarker}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleAdd}
              />
            </div>
          </div>
        ) : null}
      </AsyncState>

      {editor.open && source ? (
        <ParticipantEditorDialog
          source={source}
          marker={editor.marker}
          writable={writable}
          onClose={handleCloseEditor}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}