/**
 * 异步函数错误处理工具
 * 包装异步控制器函数，自动捕获错误并传递到Express的错误处理中间件
 * @param {Function} fn 异步控制器函数
 * @returns {Function} 包装后的异步控制器函数
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync; 