/**
 * 认证中间件
 * 用于处理用户认证相关的中间件函数
 */
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models/associations');

/**
 * 认证中间件
 * 验证用户是否已登录，解析JWT令牌获取用户信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.authenticate = async (req, res, next) => {
  try {
    // 从请求头或查询参数或cookie中获取token
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.query.token || 
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未授权，请登录'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.status === 'banned') {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌'
      });
    }
    
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试'
    });
  }
};

/**
 * 管理员权限中间件
 * 验证用户是否具有管理员权限
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      code: 403,
      message: '权限不足，需要管理员权限'
    });
  }
};

/**
 * 可选认证中间件
 * 尝试验证用户身份，但即使未登录也允许继续
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    // 从请求头或查询参数或cookie中获取token
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.query.token || 
                  req.cookies?.token;

    if (!token) {
      // 没有token也继续
      req.user = null;
      return next();
    }

    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    // 将用户信息添加到请求对象
    req.user = user || null;
    
    next();
  } catch (error) {
    // 任何错误都当作未登录处理
    req.user = null;
    next();
  }
}; 