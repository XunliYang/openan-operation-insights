import zhCN from './locales/zh-CN';

/** 支持的语言：中文简体 / 英文。zh-CN 是唯一真源。 */
export type Locale = 'zh-CN' | 'en-US';

/** 扁平消息字典：键为点分命名空间路径，值为最终文案（已含 {name} 插值占位）。 */
export type MessageDict = Record<string, string>;

/** 消息键 = zh-CN 聚合字典的全部键。后续页面命名空间填满后自动扩展。 */
export type MessageKey = keyof typeof zhCN;
