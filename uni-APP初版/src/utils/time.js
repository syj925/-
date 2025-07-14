/**
 * 格式化时间
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的时间字符串
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  // 如果是字符串，转换为Date对象
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 检查日期是否有效
  if (isNaN(dateObj.getTime())) {
    return typeof date === 'string' ? date : '';
  }
  
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}小时前`;
  }
  
  // 小于30天
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}天前`;
  }
  
  // 同一年
  if (dateObj.getFullYear() === now.getFullYear()) {
    return `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  }
  
  // 其他情况
  return `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
};

/**
 * 格式化为完整日期时间
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的完整日期时间字符串
 */
export const formatFullDateTime = (date) => {
  if (!date) return '';
  
  // 如果是字符串，转换为Date对象
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 检查日期是否有效
  if (isNaN(dateObj.getTime())) {
    return typeof date === 'string' ? date : '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export default {
  formatTime,
  formatFullDateTime
}; 