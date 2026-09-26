import type { MouseEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { IconEdit, IconExternal, IconTrash } from '@/components/icons';
import { cn } from '@/lib/cn';
import type { MapMarker } from '@/types/contract';
import { CATEGORY_META } from './participant-categories';
import { PARTICIPANT_COPY } from './participant-copy';

export interface ParticipantCardProps {
  marker: MapMarker;
  selected: boolean;
  writable: boolean;
  onSelect: (markerId: string) => void;
  onEdit: (marker: MapMarker) => void;
  onDelete: (marker: MapMarker) => void;
  /** 面板注册 DOM 引用，实现选中后滚动到可视区 */
  itemRef?: (el: HTMLLIElement | null) => void;
}

const ICON_BTN =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60';

/** 单个参与方卡片（可编辑）：卡片主体为 button（联动地图高亮），编辑/删除为独立可聚焦按钮 */
export function ParticipantCard({
  marker,
  selected,
  writable,
  onSelect,
  onEdit,
  onDelete,
  itemRef,
}: ParticipantCardProps) {
  const categoryMeta = CATEGORY_META[marker.category];

  const handleEdit = (event: MouseEvent) => {
    event.stopPropagation();
    onEdit(marker);
  };
  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation();
    onDelete(marker);
  };

  return (
    <li
      ref={itemRef}
      className={cn(
        'flex items-center gap-1 rounded-xl border transition-colors',
        selected
          ? 'border-accent-400/50 bg-accent-500/[0.08]'
          : 'border-transparent hover:bg-white/[0.03]',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(marker.markerId)}
        aria-pressed={selected}
        aria-label={PARTICIPANT_COPY.selectAria(marker.label)}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
      >
        <Avatar src={marker.logoUrl} name={marker.label} fallbackId={marker.markerId} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                'truncate text-sm font-medium',
                selected ? 'text-accent-200' : 'text-white',
              )}
            >
              {marker.label}
            </span>
            <Badge tone={categoryMeta.tone}>{categoryMeta.label}</Badge>
            {marker.origin === 'manual' ? (
              <Badge tone="neutral">{PARTICIPANT_COPY.manualBadge}</Badge>
            ) : null}
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
          aria-label={PARTICIPANT_COPY.homepageAria(marker.label)}
          className={cn(ICON_BTN, 'mr-1')}
        >
          <IconExternal width={14} height={14} />
        </a>
      ) : null}

      {writable ? (
        <>
          <button
            type="button"
            onClick={handleEdit}
            aria-label={PARTICIPANT_COPY.editAria(marker.label)}
            className={ICON_BTN}
          >
            <IconEdit width={14} height={14} />
          </button>
          {marker.origin === 'manual' ? (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={PARTICIPANT_COPY.deleteAria(marker.label)}
              className={cn(ICON_BTN, 'hover:text-rose-300')}
            >
              <IconTrash width={14} height={14} />
            </button>
          ) : null}
        </>
      ) : null}
    </li>
  );
}