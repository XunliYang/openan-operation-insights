import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { echarts, type ECharts, type EChartsCoreOption, type EChartsEventHandler } from '@/lib/echarts';

export interface EChartProps {
  option: EChartsCoreOption;
  height?: number | string;
  className?: string;
  /** 需要响应图表交互时传入（如环形图点击下钻） */
  onEvent?: EChartsEventHandler;
  ariaLabel?: string;
}

/**
 * ECharts 轻封装：
 * - ResizeObserver 自适应容器尺寸
 * - 卸载时 dispose，避免内存泄漏
 * - option 变化时整体替换（notMerge）
 */
export function EChart({ option, height = 280, className, onEvent, ariaLabel }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = echarts.init(container, undefined, { renderer: 'canvas' });
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      // 幂等守卫：StrictMode 双挂载 / 卸载后排队回调可能命中已 dispose 的实例；
      // echarts 5.6 的 resize() 内部已有 _disposed 早退（仅告警不抛错），此处显式跳过以免产生误导性告警。
      if (!chart.isDisposed()) chart.resize();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    // 幂等守卫：卸载后（StrictMode 双调用时序）不重复 setOption
    if (chart && !chart.isDisposed()) chart.setOption(option, true);
  }, [option]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || chart.isDisposed() || !onEvent) return;

    chart.on('click', onEvent);
    return () => {
      chart.off('click', onEvent);
    };
  }, [onEvent]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={cn('w-full', className)}
      style={{ height }}
    />
  );
}
