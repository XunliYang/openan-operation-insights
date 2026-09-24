import * as echarts from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 按需注册，避免把整个 echarts 打进产物
echarts.use([
  PieChart,
  BarChart,
  GraphicComponent,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

export { echarts };
export type { EChartsCoreOption, ECharts } from 'echarts/core';
/** 事件订阅回调签名（echarts 未导出公共类型，这里做最小声明） */
export type EChartsEventHandler = (params: unknown) => void;
