/**
 * 分页工具函数
 * 提供分页查询的辅助方法
 */

/**
 * 获取分页参数
 * @param {number|string} page - 当前页码
 * @param {number|string} size - 每页大小
 * @returns {Object} 分页参数对象 { limit, offset }
 */
const getPagination = (page, size) => {
  const pageNum = parseInt(page) || 1;
  const sizeNum = parseInt(size) || 10;
  
  // 确保页码和大小至少为1
  const validPage = Math.max(1, pageNum);
  const validSize = Math.max(1, sizeNum);
  
  return {
    limit: validSize,
    offset: (validPage - 1) * validSize
  };
};

/**
 * 处理分页数据
 * @param {Object} data - 包含count和rows的查询结果
 * @param {number|string} page - 当前页码
 * @param {number|string} limit - 每页大小
 * @returns {Object} 分页响应对象
 */
const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = parseInt(page) || 1;
  const limitPerPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(totalItems / limitPerPage);
  
  return {
    totalItems,
    items,
    totalPages,
    currentPage
  };
};

module.exports = {
  getPagination,
  getPagingData
}; 