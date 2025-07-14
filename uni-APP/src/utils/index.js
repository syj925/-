/**
 * 工具函数入口文件
 */

// 导入工具模块
import DateUtils from './date';
import UrlUtils from './url';
import WebSocketClient from './websocket';

// 导出所有工具
export {
  DateUtils,
  UrlUtils,
  WebSocketClient
};

export default {
  date: DateUtils,
  url: UrlUtils,
  websocket: WebSocketClient
}; 