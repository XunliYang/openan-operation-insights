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
  pageTitle: '生态地图',
  pageEyebrow: 'Ecosystem Map',
  pageDescription: '以 logo 标记展示 OpenAN Participants 的来源国家/地区',
  sourceSwitch: '数据源',
  readonlyView: '只读视图',
  listTitle: '参与方清单',
  listHint: '按国家/地区分组，键盘可聚焦',
  homepageLabel: '官网',
  updatedAt: '数据更新于',
  addTitle: '手动添加参与方',
  addBody: '运维编辑 data/map-sources.manual.json 即可新增或覆盖标记，约 15 秒内生效，无需改代码或发版。',
  addTemplateHint: '字段模板（按 MapMarker 结构 + sourceId）',
} as const;
