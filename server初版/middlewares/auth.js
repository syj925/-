const jwt = require('jsonwebtoken');
const { User } = require('../models/associations');
const config = require('../config/config');

// 验证JWT Token中间件
exports.protect = async (req, res, next) => {
  try {
  let token;

    console.log('进入身份验证中间件，请求路径:', req.path);

  // 从请求头获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
      console.log('从Authorization头获取到token');
    } else {
      console.log('请求头中没有Authorization信息:', req.headers);
  }

  // 如果没有token
  if (!token) {
      console.log('没有找到有效的认证令牌');
    return res.status(401).json({
      success: false,
      message: '未授权访问，请先登录'
    });
  }

    console.log('开始验证令牌...');
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    console.log('令牌验证成功，用户ID:', decoded.id);

    // 检查用户是否存在
    const user = await User.scope('withoutPassword').findByPk(decoded.id);

    if (!user) {
      console.log('用户不存在，ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: '此用户已不存在'
      });
    }

    console.log('用户验证成功:', user.id, user.username);

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('身份验证失败，错误类型:', error.name);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌，请重新登录'
      });
    }
    
    // 其他错误
    return res.status(401).json({
      success: false,
      message: '身份验证失败，请重新登录'
    });
  }
};

// 限制访问角色中间件
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权访问，请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '无权访问该资源'
      });
    }

    next();
  };
};

// 管理员权限检查中间件
exports.admin = (req, res, next) => {
  // 确保用户已经通过了认证
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '需要登录后才能访问'
    });
  }
  
  // 检查用户是否是管理员
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限才能访问'
    });
  }
  
  // 如果是管理员，继续执行下一个中间件或路由处理器
  next();
};

// 管理员保护中间件 - 结合身份验证和管理员检查
exports.adminProtect = async (req, res, next) => {
  try {
    // 先进行身份验证
    await exports.protect(req, res, () => {
      // 然后检查管理员权限
      if (req.user && req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: '需要管理员权限才能访问'
      });
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证失败'
    });
  }
}; 