/**
 * 图片路径辅助工具
 * 简化版本 - 直接返回原始路径
 */

/**
 * 直接返回原始图片路径
 * @param {string} path - 原始图片路径
 * @return {string} 原始图片路径
 */
export function getEnglishImagePath(path) {
  return path || '';
}

/**
 * 便捷方法,直接返回原始路径
 * @param {string} path - 图片路径
 * @returns {string} - 原始路径
 */
export function getImage(path) {
  return path || '';
}

export default {
  getEnglishImagePath,
  getImage
}; 