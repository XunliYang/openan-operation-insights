import type { ReactNode } from 'react';
import { ErrorState, EmptyState } from './States';
import { useI18n } from '@/i18n/context';

export interface AsyncStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  /** 加载态骨架 */
  skeleton: ReactNode;
  emptyTitle?: string;
  emptyHint?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}

/**
 * 统一的「加载 / 错误 / 空 / 正常」四态渲染。
 * 每个区块独立使用，保证单点失败不拖垮整页（见 02 文档 6.2）。
 */
export function AsyncState({
  isLoading,
  isError,
  error,
  isEmpty = false,
  onRetry,
  skeleton,
  emptyTitle,
  emptyHint,
  compact = false,
  children,
}: AsyncStateProps) {
  const { t } = useI18n();
  const resolvedEmptyTitle = emptyTitle ?? t('common.state.empty');

  if (isLoading) return <>{skeleton}</>;

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} compact={compact} />;
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={resolvedEmptyTitle}
        hint={emptyHint}
        className={compact ? 'px-4 py-8' : undefined}
      />
    );
  }

  return <>{children}</>;
}
