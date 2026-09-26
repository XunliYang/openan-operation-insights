/**
 * 地图域文案常量 —— 集中收口点（仅地图组件 / 页面图例级）。
 *
 * 字段名与原始 i18n 键一一对应（`map.loading` → `MAP_COPY.loading` 等），
 * 后续接入 i18n 时只需把这里的值替换为 `useI18n()` 取值，组件/页面无需改动。
 * 默认写中文，与仓库现有页面（无 i18n、中文硬编码）保持一致。
 *
 * 卡片 / 表单 / 搜索 / 分类 文案已移到 `participant-copy.ts`（`PARTICIPANT_COPY`），
 * 卡片模块不得 import 本文件取文案。
 */
export const MAP_COPY = {
  empty: '当前数据源没有可展示的标记',
  zoomIn: '放大',
  zoomOut: '缩小',
  zoomReset: '复位视图',
  fitAll: '复位',
  tileUnavailable: '瓦片底图加载失败，已切换为离线的矢量轮廓底图',
  pickHint: '点击地图选取位置，经纬度将回填到表单',
  clusterCount: '个标记',
  pageTitle: '生态地图',
  pageEyebrow: 'Ecosystem Map',
  pageDescription: '以 logo 标记展示 OpenAN Participants 的来源国家/地区',
  sourceSwitch: '数据源',
  readonlyView: '只读视图',
  readonlyBanner: '当前为只读视图',
  updatedAt: '数据更新于',
} as const;