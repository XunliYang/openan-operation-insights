import { createFormatters } from '@/i18n/formatters';
import type { Formatters } from '@/i18n/formatters';

/**
 * locale 相关的格式化委托给 i18n 内核注入的格式化器（默认 zh-CN）。
 * 纯函数（formatCompact / formatDelta / daysUntil / toDateInput / fromDateInput /
 * initialsOf）与 locale 无关，原样保留。所有导出名与签名不变，调用点零改动。
 */
let formatters: Formatters = createFormatters('zh-CN');

/** 由 I18nProvider 在渲染时同步注入当前 locale 的格式化器。 */
export function setFormatters(next: Formatters): void {
  formatters = next;
}

export function formatNumber(value: number): string {
  return formatters.formatNumber(value);
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

export function formatDate(iso?: string | null): string {
  return formatters.formatDate(iso);
}

export function formatDateTime(iso?: string | null): string {
  return formatters.formatDateTime(iso);
}

export function formatDateRange(start: string, end: string): string {
  return formatters.formatDateRange(start, end);
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
