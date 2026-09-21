import type { CSSProperties } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, ContributionLevelBadge, OrganizationTypeBadge } from '@/components/ui/Badge';
import { IconArrowRight, IconExternal, IconUsers } from '@/components/icons';
import { cn } from '@/lib/cn';
import type { OrganizationCard } from '@/types/contract';

const LEVEL_BAR: Record<string, string> = {
  high: 'from-accent-400 to-accent-500',
  medium: 'from-brand-400 to-brand-500',
  low: 'from-slate-500 to-slate-600',
  zero: 'from-slate-600 to-slate-600',
};

const LEVEL_WIDTH: Record<string, string> = {
  high: 'w-full',
  medium: 'w-2/3',
  low: 'w-1/3',
  zero: 'w-0',
};

function OrganizationTile({ org, index }: { org: OrganizationCard; index: number }) {
  const score = org.contributionScore ?? 0;
  /** 后端对 0 分同样返回 low；前端以「暂无贡献」样式呈现（ADR-0001） */
  const level = score > 0 ? org.contributionLevel ?? 'low' : 'zero';

  return (
    <article
      className="glass-card glass-card--hover reveal group flex flex-col p-5"
      style={{ '--d': `${Math.min(index, 8) * 55}ms` } as CSSProperties}
    >
      {/* Logo 通栏横幅（3:1），占满卡片内容宽度，避免挤压下方信息 */}
      <Avatar src={org.logoUrl} name={org.name} size="banner" className="w-full" />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[0.95rem] font-semibold text-white" title={org.name}>
            {org.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <OrganizationTypeBadge type={org.type} />
          </div>
        </div>
        {score > 0 ? (
          <ContributionLevelBadge level={org.contributionLevel} />
        ) : (
          <Badge tone="neutral">暂无贡献</Badge>
        )}
      </div>

      {org.description ? (
        <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-slate-400">{org.description}</p>
      ) : null}

      {org.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {org.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="chip text-[0.68rem]">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-[0.7rem] text-slate-500">
          <span>综合贡献分</span>
          <span className="numeric font-semibold text-slate-300">{score}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn(
              'h-full origin-left rounded-full bg-gradient-to-r animate-grow-x',
              LEVEL_BAR[level] ?? LEVEL_BAR.low,
              LEVEL_WIDTH[level] ?? LEVEL_WIDTH.low,
            )}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          {org.homepageUrl ? (
            <a
              href={org.homepageUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-slate-400 transition hover:text-brand-300"
            >
              组织主页
              <IconExternal width={13} height={13} />
            </a>
          ) : (
            <span className="text-[0.72rem] text-slate-600">无公开主页</span>
          )}

          <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-brand-300/0 transition-all duration-300 group-hover:text-brand-300">
            贡献明细
            <IconArrowRight width={13} height={13} />
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * 独立开发者卡片（伪组织 unattributed，type='individual'）。
 * 中性色 + 个人图标，与组织卡片视觉区分；人数来自 home/summary 的 externalDeveloperCount。
 */
function IndividualTile({
  org,
  memberCount,
  index,
}: {
  org: OrganizationCard;
  memberCount?: number;
  index: number;
}) {
  const score = org.contributionScore ?? 0;
  /** 后端对 0 分同样返回 low；前端以「暂无贡献」样式呈现（ADR-0001） */
  const level = score > 0 ? org.contributionLevel ?? 'low' : 'zero';

  return (
    <article
      className="glass-card glass-card--hover reveal group flex flex-col border border-dashed border-white/15 p-5"
      style={{ '--d': `${Math.min(index, 8) * 55}ms` } as CSSProperties}
    >
      {/* 占位横幅：与组织 Logo 区同为 3:1 通栏，保持网格对齐 */}
      <span className="flex aspect-[3/1] w-full shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300">
        <IconUsers width={30} height={30} />
      </span>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[0.95rem] font-semibold text-white" title={org.name}>
            {org.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">未归属组织</Badge>
          </div>
        </div>
        {score > 0 ? (
          <ContributionLevelBadge level={org.contributionLevel} />
        ) : (
          <Badge tone="neutral">暂无贡献</Badge>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-slate-400">
        {org.description ?? '未归属到任何组织的独立贡献者聚合。'}
      </p>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-[0.7rem] text-slate-500">
          <span>独立开发者人数</span>
          <span className="numeric font-semibold text-slate-300">
            {typeof memberCount === 'number' ? `${memberCount} 人` : '—'}
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[0.7rem] text-slate-500">
          <span>综合贡献分</span>
          <span className="numeric font-semibold text-slate-300">{score}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn(
              'h-full origin-left rounded-full bg-gradient-to-r animate-grow-x',
              LEVEL_BAR[level] ?? LEVEL_BAR.low,
              LEVEL_WIDTH[level] ?? LEVEL_WIDTH.low,
            )}
          />
        </div>
      </div>
    </article>
  );
}

export function OrganizationWall({
  organizations,
  individualCount,
}: {
  organizations: OrganizationCard[];
  /** 独立开发者人数（home/summary 的 externalDeveloperCount） */
  individualCount?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {organizations.map((org, index) =>
        org.type === 'individual' ? (
          <IndividualTile
            key={org.orgId}
            org={org}
            memberCount={individualCount}
            index={index}
          />
        ) : (
          <OrganizationTile key={org.orgId} org={org} index={index} />
        ),
      )}
    </div>
  );
}
