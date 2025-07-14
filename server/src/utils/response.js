const errorCodes = require('../constants/error-codes');

/**
 * API响应格式化工具
 */
class ResponseUtil {
  /**
   * 成功响应
   * @param {Object} data 响应数据
   * @param {String} message 响应消息
   * @returns {Object} 格式化的响应对象
   */
  static success(data = null, message = '成功') {
    return {
      code: 0,
      msg: message,
      data
    };
  }

  /**
   * 错误响应
   * @param {Object} error 错误对象 {code, message}
   * @param {Object} data 额外数据
   * @returns {Object} 格式化的响应对象
   */
  static error(error = errorCodes.UNKNOWN_ERROR, data = null) {
    return {
      code: error.code,
      msg: error.message,
      data
    };
  }

  /**
   * 分页响应
   * @param {Array} list 数据列表
   * @param {Number} page 当前页码
   * @param {Number} pageSize 每页条数
   * @param {Number} total 总条数
   * @param {Object} extraData 额外数据
   * @returns {Object} 格式化的分页响应对象
   */
  static page(list, page, pageSize, total, extraData = {}) {
    return this.success({
      list,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total
      },
      ...extraData
    });
  }

  /**
   * 创建自定义错误响应
   * @param {Number} code 错误码
   * @param {String} message 错误消息
   * @param {Object} data 额外数据
   * @returns {Object} 格式化的响应对象
   */
  static customError(code, message, data = null) {
    return {
      code,
      msg: message,
      data
    };
  }
}

module.exports = ResponseUtil; 