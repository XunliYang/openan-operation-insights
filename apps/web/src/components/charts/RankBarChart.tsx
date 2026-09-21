import { useMemo } from 'react';
import { EChart } from './EChart';
import { AXIS_TEXT, SPLIT_LINE, TOOLTIP_BASE, horizontalGradient } from '@/lib/chart-theme';
import { formatNumber } from '@/lib/format';
import type { EChartsCoreOption } from '@/lib/echarts';

export interface RankBarItem {
  name: string;
  value: number;
}

export interface RankBarChartProps {
  items: RankBarItem[];
  height?: number;
  metricLabel?: string;
}

/** 横向排行榜柱图：按数值降序，顶部为最大值（echarts y 轴自下而上，故反转） */
export function RankBarChart({ items, height = 300, metricLabel = '数值' }: RankBarChartProps) {
  const option = useMemo<EChartsCoreOption>(() => {
    const ordered = [...items].sort((a, b) => a.value - b.value);

    return {
      grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...TOOLTIP_BASE,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.045)' } },
        formatter: (params: unknown) => {
          const list = params as Array<{ name: string; value: number }>;
          const item = list[0];
          return `${item.name}<br/><b style="font-size:13px">${formatNumber(item.value)}</b> ${metricLabel}`;
        },
      },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: AXIS_TEXT, fontSize: 11, formatter: (value: number) => formatNumber(value) },
      },
      yAxis: {
        type: 'category',
        data: ordered.map((item) => item.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#c8d3e8', fontSize: 12, width: 110, overflow: 'truncate' },
      },
      series: [
        {
          type: 'bar',
          barWidth: 14,
          itemStyle: {
            borderRadius: [0, 7, 7, 0],
            color: horizontalGradient('#1c5fd0', '#4b96ff'),
          },
          emphasis: { itemStyle: { color: horizontalGradient('#2472f5', '#7ff0e0') } },
          label: {
            show: true,
            position: 'right',
            color: '#93a3bd',
            fontSize: 11,
            formatter: (params: unknown) => formatNumber((params as { value: number }).value),
          },
          data: ordered.map((item) => item.value),
          animationDuration: 700,
          animationEasing: 'cubicOut',
        },
      ],
    };
  }, [items, metricLabel]);

  return <EChart option={option} height={height} ariaLabel="组织排行柱状图" />;
}
