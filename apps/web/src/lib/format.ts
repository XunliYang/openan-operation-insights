const NBSP_NARROW = '\u202f';

/** 千分位；超过 10 万时以"万"为单位压缩，保留一位小数 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 100_000) {
    const compact = (value / 10_000).toFixed(abs >= 1_000_000 ? 0 : 1);
    return `${compact.replace(/\.0$/, '')}${NBSP_NARROW}万`;
  }
  return value.toLocaleString('zh-CN');
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
}

export function formatDelta(delta?: number): string {
  if (delta === undefined || delta === null || !Number.isFinite(delta)) return '—';
  return delta > 0 ? `+${formatNumber(delta)}` : formatNumber(delta);
}

const DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_FORMATTER.format(date);
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return DATETIME_FORMATTER.format(date);
}

export function formatDateRange(start: string, end: string): string {
  const startText = formatDate(start);
  const endText = formatDate(end);
  return startText === endText ? startText : `${startText} — ${endText}`;
}

export function daysUntil(iso: string, now = Date.now()): number {
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - now) / 86_400_000));
}

/** 日期时间（YYYY-MM-DDTHH:mm:ssZ）→ <input type="date"> 需要的 YYYY-MM-DD */
export function toDateInput(iso?: string): string {
  if (!iso) return '';
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toISOString().slice(0, 10);
}

/** <input type="date"> 的 YYYY-MM-DD → 契约要求的 ISO 8601 */
export function fromDateInput(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function initialsOf(name?: string, fallbackId?: string): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
  }
  const id = fallbackId?.trim();
  return id ? id.slice(0, 2).toUpperCase() : '?';
}
