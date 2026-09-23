import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { I18nContext } from './context';
import type { I18nValue } from './context';
import type { Locale, MessageDict, MessageKey } from './types';
import { createFormatters } from './formatters';
import { setFormatters } from '@/lib/format';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

const STORAGE_KEY = 'openan.locale';

const MESSAGES: Record<Locale, MessageDict> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/** 从 localStorage 恢复语言；非法或缺省时回退 zh-CN。 */
function resolveInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh-CN' || stored === 'en-US') return stored;
  } catch {
    // localStorage 不可用（隐私模式等）时忽略
  }
  return 'zh-CN';
}

/** `{name}` 占位符插值：缺失的参数原样保留，便于暴露调用问题。 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  const formatters = useMemo(() => createFormatters(locale), [locale]);

  // 模块级可变格式化器注入：format.ts 的纯函数在组件外被调用时无法走 hook，
  // 因此在 Provider 渲染时同步注入当前 locale 的格式化器，保证调用点零改动。
  setFormatters(formatters);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // 隐私模式下写入失败不阻塞
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>): string => {
      const template = MESSAGES[locale][key];
      if (template === undefined) return String(key);
      return interpolate(template, params);
    },
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t,
      formatNumber: formatters.formatNumber,
      formatDate: formatters.formatDate,
      formatDateTime: formatters.formatDateTime,
      formatDateRange: formatters.formatDateRange,
    }),
    [locale, setLocale, t, formatters],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
