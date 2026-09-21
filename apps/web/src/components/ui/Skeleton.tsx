import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} aria-hidden />;
}

export function SkeletonMetricCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="glass-card reveal p-5" style={{ '--d': `${delay}ms` } as CSSProperties}>
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="mt-5 h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-28" />
      <Skeleton className="mt-4 h-3 w-16" />
    </div>
  );
}

export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-8', className)}>
      <Skeleton className="h-40 w-40 shrink-0 rounded-full" />
      <div className="flex-1 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-3" style={{ width: `${88 - index * 12}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}
