import { useMemo } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { AsyncState } from '@/components/ui/AsyncState';
import { SkeletonChart } from '@/components/ui/Skeleton';
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart';
import { CHART_PALETTE } from '@/lib/chart-theme';
import { formatNumber } from '@/lib/format';
import { IconLayers } from '@/components/icons';
import type { OrganizationContribution } from '@/types/contract';

/** 占比低于该阈值的组织并入「其他」，避免细碎扇区淹没主要贡献方（ADR-0003） */
const MIN_SHARE = 0.03;
/** 具名扇区上限 = 调色板长度：超出部分即使占比达标也并入「其他」，保证配色不重复、图例不失控 */
const MAX_NAMED = CHART_PALETTE.length;
/** 「其他」聚合扇区固定使用中性色，与具名组织扇区区分 */
const OTHERS_NAME = '其他';
const OTHERS_COLOR = '#64748b';

export interface ContributionCompositionCardProps {
  contributions: OrganizationContribution[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
}

interface CompositionResult {
  slices: DonutSlice[];
  /** 有提交记录的组织数（含被并入「其他」的） */
  orgCount: number;
  totalCommits: number;
}

/**
 * 组织贡献分布（ADR-0003）：按 github.commits 统计各组织占比。
 * 占比低于 MIN_SHARE、或超出 MAX_NAMED 的组织并入「其他」；
 * 头部组织始终保留具名扇区，避免极端分布下整图只剩一个「其他」。
 */
function buildComposition(contributions: OrganizationContribution[]): CompositionResult {
  const ranked = contributions
    .map((item) => ({ name: item.orgName, value: item.github.commits ?? 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalCommits = ranked.reduce((sum, item) => sum + item.value, 0);
  if (ranked.length === 0 || totalCommits === 0) {
    return { slices: [], orgCount: 0, totalCommits: 0 };
  }

  const named: DonutSlice[] = [];
  let othersValue = 0;
  ranked.forEach((item, index) => {
    const share = item.value / totalCommits;
    if (index === 0 || (share >= MIN_SHARE && named.length < MAX_NAMED)) {
      named.push({
        name: item.name,
        value: item.value,
        color: CHART_PALETTE[named.length % CHART_PALETTE.length],
      });
    } else {
      othersValue += item.value;
    }
  });

  const slices =
    othersValue > 0 ? [...named, { name: OTHERS_NAME, value: othersValue, color: OTHERS_COLOR }] : named;

  return { slices, orgCount: ranked.length, totalCommits };
}

export function ContributionCompositionCard({
  contributions,
  isLoading,
  isError,
  error,
  onRetry,
}: ContributionCompositionCardProps) {
  const { slices, orgCount, totalCommits } = useMemo(
    () => (contributions ? buildComposition(contributions) : { slices: [], orgCount: 0, totalCommits: 0 }),
    [contributions],
  );

  const isEmpty = slices.length === 0;

  return (
    <Card className="reveal flex h-full flex-col">
      <CardTitle
        title="组织贡献分布"
        description="按提交数量统计各组织的贡献占比"
        icon={<IconLayers width={16} height={16} />}
        action={
          orgCount > 0 ? (
            <span className="text-[0.7rem] text-slate-500">
              <span className="numeric font-semibold text-slate-300">{orgCount}</span> 家组织
            </span>
          ) : null
        }
      />

      <div className="mt-4 flex-1">
        <AsyncState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={isEmpty}
          onRetry={onRetry}
          compact
          emptyTitle="当前条件下没有提交数据"
          emptyHint="试试放宽筛选条件或清除组织筛选。"
          skeleton={<SkeletonChart />}
        >
          <>
            <DonutChart
              slices={slices}
              height={248}
              centerLabel="提交总数"
              ariaLabel="组织提交数分布环形图"
            />

            <dl className="mt-5 space-y-2.5">
              {slices.map((slice) => {
                const percent = totalCommits > 0 ? (slice.value / totalCommits) * 100 : 0;
                return (
                  <div key={slice.name} className="flex items-center justify-between text-xs">
                    <dt className="flex items-center gap-2 text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: slice.color }} />
                      {slice.name}
                    </dt>
                    <dd className="numeric font-semibold text-slate-200">
                      {formatNumber(slice.value)}
                      <span className="ml-1.5 font-normal text-slate-500">{percent.toFixed(1)}%</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </>
        </AsyncState>
      </div>
    </Card>
  );
}
