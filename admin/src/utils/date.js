/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期
 * @param {string|Date} date 日期
 * @param {string} format 格式 默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取相对时间
 * @param {string|Date} date 日期
 * @returns {string} 相对时间描述
 */
export function getRelativeTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const dateObj = new Date(date);
  const diff = now.getTime() - dateObj.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < month) {
    return `${Math.floor(diff / day)}天前`;
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`;
  } else {
    return `${Math.floor(diff / year)}年前`;
  }
}

/**
 * 判断是否为今天
 * @param {string|Date} date 日期
 * @returns {boolean}
 */
export function isToday(date) {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const today = new Date();
  
  return dateObj.getFullYear() === today.getFullYear() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getDate() === today.getDate();
}

/**
 * 判断是否为昨天
 * @param {string|Date} date 日期
 * @returns {boolean}
 */
export function isYesterday(date) {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.getFullYear() === yesterday.getFullYear() &&
         dateObj.getMonth() === yesterday.getMonth() &&
         dateObj.getDate() === yesterday.getDate();
}


