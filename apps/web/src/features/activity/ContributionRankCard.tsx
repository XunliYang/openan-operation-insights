import { useMemo, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { AsyncState } from '@/components/ui/AsyncState';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { RankBarChart } from '@/components/charts/RankBarChart';
import { IconBolt } from '@/components/icons';
import type { ActivityRow } from './merge';

type MetricKey = 'pullRequests' | 'commits' | 'issues' | 'linesChanged';

const METRIC_OPTIONS: Array<{ value: MetricKey; label: string }> = [
  { value: 'pullRequests', label: '合并 PR' },
  { value: 'commits', label: '提交数' },
  { value: 'issues', label: 'Issue' },
  { value: 'linesChanged', label: '代码行数' },
];

const METRIC_LABEL: Record<MetricKey, string> = {
  pullRequests: '个 PR',
  commits: '次提交',
  issues: '个 Issue',
  linesChanged: '行变更',
};

export interface ContributionRankCardProps {
  rows: ActivityRow[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export function ContributionRankCard({
  rows,
  isLoading,
  isError,
  error,
  onRetry,
}: ContributionRankCardProps) {
  const [metric, setMetric] = useState<MetricKey>('pullRequests');

  const items = useMemo(
    () =>
      [...rows]
        .filter((row) => row[metric] > 0)
        .sort((a, b) => b[metric] - a[metric])
        .slice(0, 8)
        .map((row) => ({ name: row.orgName, value: row[metric] })),
    [rows, metric],
  );

  return (
    <Card className="reveal flex h-full flex-col">
      <CardTitle
        title="组织贡献排行"
        description="按所选指标展示前 8 家组织"
        icon={<IconBolt width={16} height={16} />}
        action={<Segmented options={METRIC_OPTIONS} value={metric} onChange={setMetric} size="sm" />}
      />

      <div className="mt-5 flex-1">
        <AsyncState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={items.length === 0}
          onRetry={onRetry}
          compact
          emptyTitle="该指标下暂无数据"
          emptyHint="切换其他指标，或调整筛选条件后再看。"
          skeleton={
            <div className="space-y-3 pt-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-5" style={{ width: `${92 - index * 11}%` }} />
              ))}
            </div>
          }
        >
          <RankBarChart items={items} height={300} metricLabel={METRIC_LABEL[metric]} />
        </AsyncState>
      </div>
    </Card>
  );
}
