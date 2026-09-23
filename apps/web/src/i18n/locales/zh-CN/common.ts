/**
 * common 命名空间（zh-CN 真源）。
 * 覆盖「外壳 + 通用组件」的文案；业务页面文案见同目录 home / activity / summits。
 */
const common = {
  // —— 顶部导航 ——
  'common.nav.overview': '概览',
  'common.nav.overviewHint': '伙伴共建与关键指标',
  'common.nav.activity': '社区活跃度',
  'common.nav.activityHint': '贡献与成果明细',
  'common.nav.summits': '参会情况',
  'common.nav.summitsHint': '历次峰会与参与组织',
  'common.nav.logoAriaLabel': 'OpenAN 运营洞察首页',
  'common.nav.subtitle': '运营洞察平台',
  'common.nav.readonlyBadge': '数据只读视图',

  // —— 页脚 ——
  'common.footer.contract': 'OpenAN 社区运营洞察平台 · 数据契约 v1（schemaVersion 1）',
  'common.footer.readonly': '只读视图，写操作经运维流程落库',
  'common.footer.metricsGuide': '指标口径见《数据与接口契约》',

  // —— 404 ——
  'common.notFound.title': '页面不存在',
  'common.notFound.description': '你访问的地址不在本平台的三个视图之内。可以返回概览页继续浏览。',
  'common.notFound.back': '返回概览',

  // —— 错误态（按 error.code 分派；未知错误码仍用后端 message 原文兜底）——
  'common.error.dataUnavailable': '数据源暂不可用',
  'common.error.dataUnavailableHint': '后端数据文件校验未通过，运维正在修复；其余页面不受影响。',
  'common.error.backendUnreachable': '无法连接后端服务',
  'common.error.backendUnreachableHint': '请确认 API 已在 :3000 启动，或检查网络与代理配置。',
  'common.error.requestFailed': '请求失败',
  'common.error.errorCode': '错误码：{code}',
  'common.error.loadFailed': '加载失败',
  'common.error.unknown': '未知错误，请稍后重试。',

  // —— 通用动作 / 状态 ——
  'common.action.retry': '重新加载',
  'common.state.empty': '暂无数据',

  // —— 多选控件 ——
  'common.multiSelect.all': '全部',
  'common.multiSelect.one': '1 项',
  'common.multiSelect.selectedCount': '已选 {count} 项',
  'common.multiSelect.clear': '清除',
  'common.multiSelect.search': '搜索组织',
  'common.multiSelect.noMatch': '无匹配项',
};

export default common;
