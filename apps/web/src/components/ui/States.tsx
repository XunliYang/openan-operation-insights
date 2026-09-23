import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useI18n } from '@/i18n/context';
import type { I18nValue } from '@/i18n/context';
import { IconAlert, IconInbox, IconRefresh } from '@/components/icons';

export function EmptyState({
  title,
  hint,
  icon,
  action,
  className,
}: {
  title: string;
  hint?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400">
        {icon ?? <IconInbox width={22} height={22} />}
      </span>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {hint ? <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-400">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** 错误码 → 面向用户的可读文案（与 03 文档 7.2 错误码表对齐）；未知码用后端 message 原文兜底。 */
function describeError(
  error: unknown,
  t: I18nValue['t'],
): { title: string; hint: string } {
  if (error instanceof ApiError) {
    if (error.code === 50001) {
      return {
        title: t('common.error.dataUnavailable'),
        hint: t('common.error.dataUnavailableHint'),
      };
    }
    if (error.code === -1) {
      return {
        title: t('common.error.backendUnreachable'),
        hint: t('common.error.backendUnreachableHint'),
      };
    }
    // 未知错误码：title 用后端 message 原文兜底，仅本地化兜底文案与「错误码」hint。
    return {
      title: error.message || t('common.error.requestFailed'),
      hint: t('common.error.errorCode', { code: error.code }),
    };
  }

  return {
    title: t('common.error.loadFailed'),
    hint: error instanceof Error ? error.message : t('common.error.unknown'),
  };
}

export function ErrorState({
  error,
  onRetry,
  className,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { title, hint } = describeError(error, t);

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-5',
        compact ? 'py-4' : 'py-6',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 text-rose-200">
        <IconAlert width={18} height={18} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="text-xs leading-relaxed text-rose-100/70">{hint}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/[0.09]"
        >
          <IconRefresh width={14} height={14} />
          {t('common.action.retry')}
        </button>
      ) : null}
    </div>
  );
}
