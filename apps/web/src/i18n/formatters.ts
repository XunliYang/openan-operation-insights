import type { Locale } from './types';

const NBSP_NARROW = '\u202f';

/** locale 无关的占位符：数值/日期缺失时统一显示。 */
const MISSING = '—';

export interface Formatters {
  formatNumber(value: number): string;
  formatDate(iso?: string | null): string;
  formatDateTime(iso?: string | null): string;
  formatDateRange(start: string, end: string): string;
}

/**
 * 按 locale 生成一组格式化器。
 * - 中文 formatNumber 保持旧行为（>= 10 万压缩为「万」），其余走 Intl.NumberFormat。
 * - 日期/日期时间分别用 Intl.DateTimeFormat(locale)，UTC 时区对齐契约。
 */
export function createFormatters(locale: Locale): Formatters {
  const isZh = locale === 'zh-CN';

  const numberFormat = new Intl.NumberFormat(locale);
  const dateFormat = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  });
  const dateTimeFormat = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formatNumber = (value: number): string => {
    if (!Number.isFinite(value)) return MISSING;
    if (isZh) {
      const abs = Math.abs(value);
      if (abs >= 100_000) {
        const compact = (value / 10_000).toFixed(abs >= 1_000_000 ? 0 : 1);
        return `${compact.replace(/\.0$/, '')}${NBSP_NARROW}万`;
      }
    }
    return numberFormat.format(value);
  };

  const formatDate = (iso?: string | null): string => {
    if (!iso) return MISSING;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return MISSING;
    return dateFormat.format(date);
  };

  const formatDateTime = (iso?: string | null): string => {
    if (!iso) return MISSING;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return MISSING;
    return dateTimeFormat.format(date);
  };

  const formatDateRange = (start: string, end: string): string => {
    const startText = formatDate(start);
    const endText = formatDate(end);
    return startText === endText ? startText : `${startText} — ${endText}`;
  };

  return { formatNumber, formatDate, formatDateTime, formatDateRange };
}
