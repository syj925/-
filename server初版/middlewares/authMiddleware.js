/**
 * 认证相关中间件
 * 提供用户身份验证和权限检查功能
 */
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');
const { User } = require('../models/associations');

/**
 * 验证JWT令牌的中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const auth = async (req, res, next) => {
  try {
    // 从请求头或查询参数获取令牌
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    // 验证令牌
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('认证失败:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '认证令牌已过期' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '无效的认证令牌' });
    }
    
    return res.status(401).json({ message: '认证失败' });
  }
};

/**
 * 检查用户角色的中间件
 * @param {string[]} roles - 允许的角色数组
 * @returns {Function} Express中间件函数
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未经认证的请求' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '没有权限执行此操作' });
    }
    
    next();
  };
};

/**
 * 可选的认证中间件
 * 与auth不同，即使没有令牌也会继续处理请求
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const optionalAuth = async (req, res, next) => {
  try {
    // 从请求头或查询参数获取令牌
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (!token) {
      // 没有令牌，继续但不设置用户
      next();
      return;
    }

    // 验证令牌
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    if (user) {
      // 将用户信息添加到请求对象
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // 认证失败但仍继续处理请求
    logger.debug('可选认证失败:', error);
    next();
  }
};

module.exports = {
  auth,
  checkRole,
  optionalAuth
}; 