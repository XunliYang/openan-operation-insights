/**
 * 接口冒烟脚本：逐个请求核心端点并校验响应信封。
 * 用法：先启动服务（npm run dev:api），再执行 npm run smoke -w @openan/api
 */
const BASE = process.env.API_BASE ?? 'http://localhost:3000/api';

/** 六类 + 未分类兜底（与后端 validators / DTO 口径一致） */
const CATEGORIES = [
  'operator',
  'equipment-vendor',
  'integrator',
  'it-vendor',
  'cloud-vendor',
  'research',
  'other',
];

const cases = [
  { name: '首页汇总', path: '/home/summary', expect: (d) => d.partnerCount && 'nextSummit' in d },
  { name: '贡献组织卡片', path: '/organizations?scope=contributing', expect: (d) => Array.isArray(d) },
  { name: '贡献明细', path: '/contributions?sortBy=pullRequests&order=desc&limit=5', expect: (d) => Array.isArray(d) },
  { name: '个人贡献明细', path: '/contributor-contributions?sortBy=commits&order=desc&limit=5', expect: (d) => Array.isArray(d) },
  { name: '个人贡献组织筛选', path: '/contributor-contributions?orgIds=huawei&sortBy=commits&order=desc', expect: (d) => Array.isArray(d) },
  { name: '汇总指标', path: '/contributions/summary', expect: (d) => typeof d.totals?.pullRequests === 'number' },
  { name: '成果明细', path: '/insights?sortBy=requirements&order=desc&limit=5', expect: (d) => Array.isArray(d) },
  { name: '峰会列表', path: '/summits?includeDetail=false&page=1&pageSize=10', expect: (d) => Array.isArray(d.items) },
  { name: '峰会详情', path: '/summits/one-summit-2026', expect: (d) => d.id === 'one-summit-2026' },
  { name: '峰会不存在→40402', path: '/summits/not-exist', expectError: 40402 },
  { name: '例会参会矩阵', path: '/meetings', expect: (d) => Array.isArray(d.columns) && Array.isArray(d.rows) },
  { name: '非法排序字段→40001', path: '/contributions?sortBy=oops', expectError: 40001 },
  { name: '非法年份→40003', path: '/summits?year=1999', expectError: 40003 },
  { name: '地图源列表', path: '/maps', expect: (d) => Array.isArray(d) && d.some((s) => s.sourceId === 'ecosystem-participants') },
  { name: '地图写能力(未配置令牌→只读)', path: '/maps/capabilities', expect: (d) => d.writable === false },
  { name: '地图生态源', path: '/maps/ecosystem-participants', expect: (d) => Array.isArray(d.markers) && d.markers.length >= 10 },
  { name: '地图生态源分类齐全', path: '/maps/ecosystem-participants', expect: (d) => Array.isArray(d.markers) && d.markers.length === 10 && d.markers.every((m) => CATEGORIES.includes(m.category)) },
  { name: '地图源不存在→40400', path: '/maps/not-exist', expectError: 40400 },
  {
    name: '地图写接口禁用→40301',
    path: '/maps/ecosystem-participants/markers',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markerId: 'smoke-test',
        label: 'Smoke Test',
        countryCode: 'US',
        countryName: 'United States',
        longitude: -74.01,
        latitude: 40.71,
      }),
    },
    expectError: 40301,
  },
];

let failed = 0;

for (const testCase of cases) {
  const url = `${BASE}${testCase.path}`;
  try {
    const response = await fetch(url, testCase.init);
    const body = await response.json();

    if (testCase.expectError !== undefined) {
      const ok = body.code === testCase.expectError;
      ok ? pass(testCase.name, `code=${body.code}`) : fail(testCase.name, `期望 code=${testCase.expectError}，实际 ${JSON.stringify(body)}`);
      continue;
    }

    const ok = body.code === 0 && testCase.expect(body.data);
    ok ? pass(testCase.name, `HTTP ${response.status}`) : fail(testCase.name, JSON.stringify(body).slice(0, 240));
  } catch (error) {
    fail(testCase.name, error.message);
  }
}

console.log(`\n冒烟结果：${cases.length - failed}/${cases.length} 通过`);
process.exit(failed === 0 ? 0 : 1);

function pass(name, detail) {
  console.log(`  PASS  ${name}  (${detail})`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`  FAIL  ${name}  → ${detail}`);
}