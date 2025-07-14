const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Tag } = require('../models/associations');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const config = require('../config/config');

// 生成JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expire }
  );
};

/**
 * @desc    用户注册
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { nickname, username, password } = req.body;

    // 验证必要字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供账号和密码'
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该账号已被注册'
      });
    }

    // 创建用户
    const user = await User.create({
      nickname,
      username,
      password,
      avatar: '/uploads/default-avatar.png' // 显式设置默认头像
    });

    // 生成Token
    const token = generateToken(user);

    // 响应成功信息，不返回密码
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        id: user.id,
        nickname: user.nickname,
        username: user.username,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    用户登录
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 验证必要字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供账号和密码'
      });
    }

    // 查找用户
    const user = await User.findOne({ where: { username } });

    // 验证用户存在性和密码
    if (!user || !user.checkPassword(password)) {
      return res.status(401).json({
        success: false,
        message: '账号或密码错误'
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用，请联系管理员'
      });
    }

    // 生成Token
    const token = generateToken(user);

    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          username: user.username,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取当前用户信息
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    // 重新获取用户的最新信息，包含关联的标签
    const user = await User.scope('withoutPassword').findByPk(req.user.id, {
      include: [
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'category', 'description', 'color', 'status'],
          through: { attributes: [] } // 不包含中间表数据
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息出错:', error);
    next(error);
  }
};

/**
 * @desc    更新当前用户信息
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateMe = async (req, res, next) => {
  try {
    // 获取要更新的字段
    const { nickname, email, avatar, bio } = req.body;

    // 查找用户
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户信息
    if (nickname) user.nickname = nickname;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (bio) user.bio = bio;

    // 保存更新
    await user.save();

    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '用户信息更新成功',
      data: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    用户登出
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    // 在实际应用中，可能需要将token添加到黑名单
    // 或者在Redis中保存已登出的token，直到其过期
    
    res.status(200).json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    next(error);
  }
}; 