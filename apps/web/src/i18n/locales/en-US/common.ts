import zhCommon from '../zh-CN/common';

/** common 命名空间（en-US）。键集与 zh-CN 完全一致，缺失键由 `satisfies` 触发编译错误。 */
const common = {
  // —— Top navigation ——
  'common.nav.overview': 'Overview',
  'common.nav.overviewHint': 'Partner collaboration and key metrics',
  'common.nav.activity': 'Community Activity',
  'common.nav.activityHint': 'Contributions and outcomes',
  'common.nav.summits': 'Summits',
  'common.nav.summitsHint': 'Past summits and participating organizations',
  'common.nav.logoAriaLabel': 'OpenAN Operations Insights home',
  'common.nav.subtitle': 'Operations Insights',
  'common.nav.readonlyBadge': 'Read-only view',

  // —— Footer ——
  'common.footer.contract': 'OpenAN Community Operations Insights · Data contract v1 (schemaVersion 1)',
  'common.footer.readonly': 'Read-only view; writes go through ops processes',
  'common.footer.metricsGuide': 'Metrics definitions in “Data & API Contract”',

  // —— 404 ——
  'common.notFound.title': 'Page not found',
  'common.notFound.description':
    'The address you visited is not one of this platform’s three views. You can go back to the overview.',
  'common.notFound.back': 'Back to overview',

  // —— Error states (dispatched by error.code; unknown codes fall back to the backend message) ——
  'common.error.dataUnavailable': 'Data source unavailable',
  'common.error.dataUnavailableHint':
    'The backend data file failed validation and ops is fixing it; other pages are unaffected.',
  'common.error.backendUnreachable': 'Cannot reach backend service',
  'common.error.backendUnreachableHint':
    'Confirm the API is running on :3000, or check network and proxy settings.',
  'common.error.requestFailed': 'Request failed',
  'common.error.errorCode': 'Error code: {code}',
  'common.error.loadFailed': 'Failed to load',
  'common.error.unknown': 'Unknown error, please try again later.',

  // —— Generic actions / states ——
  'common.action.retry': 'Reload',
  'common.state.empty': 'No data',

  // —— Multi-select ——
  'common.multiSelect.all': 'All',
  'common.multiSelect.one': '1 item',
  'common.multiSelect.selectedCount': '{count} selected',
  'common.multiSelect.clear': 'Clear',
  'common.multiSelect.search': 'Search organizations',
  'common.multiSelect.noMatch': 'No matches',
} satisfies Record<keyof typeof zhCommon, string>;

export default common;