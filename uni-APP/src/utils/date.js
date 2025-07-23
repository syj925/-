/**
 * 格式化时间为时间差显示
 * @param {string|number} time 时间戳或日期字符串
 * @returns {string} 格式化后的时间
 */
export const formatTimeAgo = (time) => {
  if (!time) return '';
  
  const date = typeof time === 'string' ? new Date(time) : new Date(Number(time));
  const now = new Date();
  
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) {
    return '刚刚';
  } else if (diff < 3600) { // 1小时内
    return `${Math.floor(diff / 60)}分钟前`;
  } else if (diff < 86400) { // 1天内
    return `${Math.floor(diff / 3600)}小时前`;
  } else if (diff < 2592000) { // 30天内
    return `${Math.floor(diff / 86400)}天前`;
  } else if (diff < 31536000) { // 1年内
    return `${Math.floor(diff / 2592000)}个月前`;
  } else {
    return `${Math.floor(diff / 31536000)}年前`;
  }
};

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {string|number|Date} date 日期
 * @returns {string} 格式化后的日期
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : (date instanceof Date ? date : new Date(Number(date)));
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期为 YYYY-MM-DD HH:MM:SS 格式
 * @param {string|number|Date} date 日期
 * @returns {string} 格式化后的日期
 */
export const formatDateTime = (date) => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : (date instanceof Date ? date : new Date(Number(date)));

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 通用时间格式化函数
 * @param {string|number|Date} date 日期
 * @param {string} format 格式化模板，如 'YYYY-MM-DD HH:mm'
 * @param {boolean} useUTC 是否使用UTC时间，默认false使用本地时间
 * @returns {string} 格式化后的日期
 */
export const formatTime = (date, format = 'YYYY-MM-DD HH:mm:ss', useUTC = false) => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : (date instanceof Date ? date : new Date(Number(date)));

  let year, month, day, hours, minutes, seconds;

  if (useUTC) {
    // 使用UTC时间（不进行时区转换）
    year = d.getUTCFullYear();
    month = String(d.getUTCMonth() + 1).padStart(2, '0');
    day = String(d.getUTCDate()).padStart(2, '0');
    hours = String(d.getUTCHours()).padStart(2, '0');
    minutes = String(d.getUTCMinutes()).padStart(2, '0');
    seconds = String(d.getUTCSeconds()).padStart(2, '0');
  } else {
    // 使用本地时间
    year = d.getFullYear();
    month = String(d.getMonth() + 1).padStart(2, '0');
    day = String(d.getDate()).padStart(2, '0');
    hours = String(d.getHours()).padStart(2, '0');
    minutes = String(d.getMinutes()).padStart(2, '0');
    seconds = String(d.getSeconds()).padStart(2, '0');
  }

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// 添加默认导出
export default {
  formatTimeAgo,
  formatDate,
  formatDateTime,
  formatTime
};