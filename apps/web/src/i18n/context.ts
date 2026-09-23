import { createContext, useContext } from 'react';
import type { Locale, MessageKey } from './types';

/** i18n 运行时接口：语言、翻译、格式化。Provider 外使用 useI18n 会抛错。 */
export interface I18nValue {
  locale: Locale;
  setLocale(next: Locale): void;
  t(key: MessageKey, params?: Record<string, string | number>): string;
  formatNumber(value: number): string;
  formatDate(iso?: string | null): string;
  formatDateTime(iso?: string | null): string;
  formatDateRange(start: string, end: string): string;
}

export const I18nContext = createContext<I18nValue | undefined>(undefined);

/** 读取当前 i18n 上下文；在 Provider 之外调用会立即抛错（暴露装配期错误，而非静默回退中文）。 */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n 必须在 <I18nProvider> 内使用');
  }
  return value;
}
