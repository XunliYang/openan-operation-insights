import type { ReactNode } from 'react';

export interface PageHeadingProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeading({ eyebrow, title, description, meta, actions }: PageHeadingProps) {
  return (
    <div className="reveal flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-400/90">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
        ) : null}
        {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
