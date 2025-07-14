/**
 * 日期工具类
 */
class DateUtil {
  /**
   * 获取当前日期时间（ISO格式）
   * @returns {String} ISO格式的日期时间
   */
  static now() {
    return new Date().toISOString();
  }

  /**
   * 获取当前时间戳（毫秒）
   * @returns {Number} 时间戳（毫秒）
   */
  static timestamp() {
    return Date.now();
  }

  /**
   * 格式化日期时间
   * @param {Date|String|Number} date 日期对象、ISO字符串或时间戳
   * @param {String} format 格式化模式，默认为'YYYY-MM-DD HH:mm:ss'
   * @returns {String} 格式化后的日期时间
   */
  static format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    
    const year = d.getFullYear().toString();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 计算相对时间（如：刚刚、5分钟前、1小时前等）
   * @param {Date|String|Number} date 日期对象、ISO字符串或时间戳
   * @returns {String} 相对时间描述
   */
  static relativeTime(date) {
    const now = Date.now();
    const targetTime = new Date(date).getTime();
    const diff = now - targetTime;
    
    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    }
    
    // 小于1天
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    }
    
    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
    }
    
    // 小于12个月
    if (diff < 12 * 30 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (30 * 24 * 60 * 60 * 1000))}个月前`;
    }
    
    // 大于等于12个月
    return `${Math.floor(diff / (12 * 30 * 24 * 60 * 60 * 1000))}年前`;
  }

  /**
   * 计算两个日期之间的差异（毫秒）
   * @param {Date|String|Number} date1 日期1
   * @param {Date|String|Number} date2 日期2
   * @returns {Number} 差异（毫秒）
   */
  static diff(date1, date2) {
    return new Date(date1).getTime() - new Date(date2).getTime();
  }

  /**
   * 判断日期是否在指定时间范围内
   * @param {Date|String|Number} date 日期
   * @param {Date|String|Number} start 开始日期
   * @param {Date|String|Number} end 结束日期
   * @returns {Boolean} 是否在范围内
   */
  static isBetween(date, start, end) {
    const d = new Date(date).getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return d >= s && d <= e;
  }

  /**
   * 获取当天开始时间
   * @returns {Date} 当天开始时间
   */
  static startOfDay() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * 获取当天结束时间
   * @returns {Date} 当天结束时间
   */
  static endOfDay() {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }
}

module.exports = DateUtil; 