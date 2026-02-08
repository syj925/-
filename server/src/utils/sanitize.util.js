const xss = require('xss');

/**
 * XSS清理工具
 */
const SanitizeUtil = {
  /**
   * 清理HTML内容，防止XSS攻击
   * @param {string} content - 要清理的内容
   * @returns {string} 清理后的内容
   */
  sanitizeHtml(content) {
    if (!content || typeof content !== 'string') return content;
    return xss(content);
  },

  /**
   * 清理对象中的指定字段
   * @param {Object} obj - 要清理的对象
   * @param {string[]} fields - 要清理的字段名数组
   * @returns {Object} 清理后的对象
   */
  sanitizeFields(obj, fields = ['content', 'title']) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = { ...obj };
    for (const field of fields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = this.sanitizeHtml(sanitized[field]);
      }
    }
    return sanitized;
  }
};

module.exports = SanitizeUtil;
