/**
 * 地图域文案常量 —— 集中收口点。
 *
 * 字段名与原始 i18n 键一一对应（`map.loading` → `MAP_COPY.loading` 等），
 * 后续接入 i18n 时只需把这里的值替换为 `useI18n()` 取值，组件/页面无需改动。
 * 默认写中文，与仓库现有页面（无 i18n、中文硬编码）保持一致。
 */
export const MAP_COPY = {
  loading: '地图加载中…',
  registerFailed: '地图底图加载失败',
  retry: '重试',
  empty: '当前数据源没有可展示的标记',
  tooltipCountry: '国家/地区',
  tooltipLocation: '所在地',
} as const;
