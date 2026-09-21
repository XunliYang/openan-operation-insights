/**
 * 采集器常量（见 docs/05-integration-roadmap.md 第 2 章）。
 */

/** 未归属到任何组织的贡献者，统一归入该伪组织（契约见 04 文档 §3.1） */
export const ORG_UNATTRIBUTED = 'unattributed';

/** 伪组织展示名（与 data/organizations.json 保持一致） */
export const UNATTRIBUTED_DISPLAY_NAME = '独立开发者';

/**
 * 搜索类接口「单查询最多返回结果数」硬上限。
 * 该上限与账号权限/等级无关，不因刷新或升级账号而提高。
 */
export const SEARCH_RESULT_LIMIT = 1000;

/** GraphQL 单页节点数（GitHub 上限为 100） */
export const PAGE_SIZE = 100;

/** GraphQL 配额安全下限：低于该值即中止本轮采集，保留上次数据 */
export const RATE_LIMIT_FLOOR = 500;

/** 串行请求间隔（毫秒），避免瞬时并发触发二级限流 */
export const REQUEST_SPACING_MS = 120;

/** 单个采集任务的最大翻页数，防止异常情况下的无限循环 */
export const MAX_PAGES = 200;
