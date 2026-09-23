import common from './common';
import home from './home';
import activity from './activity';
import summits from './summits';

/**
 * en-US 聚合字典。
 * 后续页面 issue 只需填充各自命名空间文件，本文件不再改动。
 */
export default { ...common, ...home, ...activity, ...summits };