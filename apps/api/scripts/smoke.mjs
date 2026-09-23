/**
 * 接口冒烟脚本：逐个请求核心端点并校验响应信封。
 * 用法：先启动服务（npm run dev:api），再执行 npm run smoke -w @openan/api
 */
const BASE = process.env.API_BASE ?? 'http://localhost:3000/api';

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
];

let failed = 0;

for (const testCase of cases) {
  const url = `${BASE}${testCase.path}`;
  try {
    const response = await fetch(url);
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
