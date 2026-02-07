const errorCodes = require("../constants/error-codes");

/**
 * API响应格式化工具
 *
 * 统一响应格式：
 *   成功: { success: true,  code: 0,    msg, message, data }
 *   失败: { success: false, code: N,    msg, message, data }
 *   分页: { success: true,  code: 0,    msg, message, data: { list, pagination, ... } }
 */
class ResponseUtil {
  /**
   * 成功响应
   * @param {Object} data 响应数据
   * @param {String} message 响应消息
   * @returns {Object} 格式化的响应对象
   */
  static success(data = null, message = "成功") {
    return {
      success: true,
      code: 0,
      msg: message,
      message: message, // 兼容前端的message字段
      data,
    };
  }

  /**
   * 错误响应
   *
   * 支持多种调用方式（兼容项目中已有的各种用法）：
   *   1. ResponseUtil.error(errorCodes.PARAM_ERROR)           → 标准用法，传入错误码对象
   *   2. ResponseUtil.error(errorCodes.PARAM_ERROR, extraData) → 标准用法 + 额外数据
   *   3. ResponseUtil.error('参数错误')                        → 简写，传入字符串消息
   *   4. ResponseUtil.error('参数错误', extraData)             → 简写 + 额外数据
   *
   * @param {Object|String} error 错误码对象 {code, message} 或错误消息字符串
   * @param {Object} data 额外数据
   * @returns {Object} 格式化的响应对象
   */
  static error(error = errorCodes.UNKNOWN_ERROR, data = null) {
    // 兼容字符串参数：ResponseUtil.error('参数错误') 或 ResponseUtil.error('参数错误', data)
    if (typeof error === "string") {
      return {
        success: false,
        code: errorCodes.UNKNOWN_ERROR.code,
        msg: error,
        message: error,
        data,
      };
    }

    // 兼容数字参数（极少数情况，如 ResponseUtil.error(400)）
    if (typeof error === "number") {
      return {
        success: false,
        code: error,
        msg: "请求失败",
        message: "请求失败",
        data,
      };
    }

    // 标准用法：传入错误码对象 { code, message }
    const code =
      error.code !== undefined ? error.code : errorCodes.UNKNOWN_ERROR.code;
    const msg = error.message || errorCodes.UNKNOWN_ERROR.message;

    return {
      success: false,
      code,
      msg,
      message: msg, // 兼容前端的message字段
      data,
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
        total,
      },
      ...extraData,
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
      success: false,
      code,
      msg: message,
      message: message, // 兼容前端的message字段
      data,
    };
  }
}

module.exports = ResponseUtil;
