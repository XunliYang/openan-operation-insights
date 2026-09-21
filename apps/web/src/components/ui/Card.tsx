import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

export function Card({ className, interactive = false, padded = true, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card text-slate-200',
        interactive && 'glass-card--hover',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    />
  );
}

export interface CardTitleProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardTitle({ title, description, action, icon, className }: CardTitleProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-brand-300">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate text-[0.95rem] font-semibold text-white">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
