const express = require('express');
const router = express.Router();

// 引入各个模块的路由
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const categoryRoutes = require('./category.routes');
const topicRoutes = require('./topic.routes');
const commentRoutes = require('./comment.routes');
const likeRoutes = require('./like.routes');
const favoriteRoutes = require('./favorite.routes');
const messageRoutes = require('./message.routes');
const followRoutes = require('./follow.routes');
const uploadRoutes = require('./upload.routes');
const adminRoutes = require('./admin.routes');
const searchRoutes = require('./search.routes');
const settingsRoutes = require('./settings.routes');
const eventRoutes = require('./event.routes');
const eventRegistrationRoutes = require('./event-registration.routes');
const userController = require('../controllers/user.controller');
const { Validator } = require('../utils');
const Joi = require('joi');
// 后续将在此处引入其他路由

// 认证相关API
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(30).required(),
  nickname: Joi.string().min(2).max(20).required()
});

// 添加认证API路由，确保路径和前端匹配
router.post('/api/auth/login', Validator.validateBody(loginSchema), userController.login);
router.post('/api/auth/register', Validator.validateBody(registerSchema), userController.register);

// API路由
router.use('/api/users', userRoutes);
router.use('/api/posts', postRoutes);
router.use('/api/comments', commentRoutes);
router.use('/api/likes', likeRoutes);
router.use('/api/favorites', favoriteRoutes);
router.use('/api/follows', followRoutes);
router.use('/api/messages', messageRoutes);
router.use('/api/topics', topicRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/upload', uploadRoutes);
router.use('/api/search', searchRoutes);
router.use('/api/settings', settingsRoutes);
router.use('/api/events', eventRoutes);
router.use('/api/registrations', eventRegistrationRoutes);

// 管理员API路由
router.use('/api/admin', adminRoutes);

// 配置版本检查路由（无需认证，供前端App使用）
router.get('/api/config-version', async (req, res) => {
  try {
    const { Setting } = require('../models');

    // 获取当前配置版本信息
    const versionSetting = await Setting.findOne({
      where: { key: 'configVersion' }
    });

    let versionInfo;
    if (versionSetting) {
      versionInfo = JSON.parse(versionSetting.value);
    } else {
      // 默认版本信息
      versionInfo = {
        version: '1.0.0',
        updateTime: new Date().toISOString(),
        description: '初始版本',
        forceUpdate: false,
        downloadCount: 0
      };

      // 创建默认版本设置
      await Setting.create({
        key: 'configVersion',
        value: JSON.stringify(versionInfo),
        type: 'json',
        description: '当前配置版本信息'
      });
    }

    // 添加下载地址
    versionInfo.downloadUrl = '/api/content-rules';

    res.json({
      code: 0,
      message: '获取版本信息成功',
      data: versionInfo
    });
  } catch (error) {
    console.error('获取配置版本信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取版本信息失败',
      data: null
    });
  }
});

// 内容验证规则路由（无需认证，供前端缓存使用）
router.get('/api/content-rules', async (req, res) => {
  try {
    const { Setting } = require('../models');

    // 获取所有验证相关的设置
    const settings = await Setting.findAll({
      where: {
        key: [
          'minPostLength',
          'maxPostLength',
          'enableSensitiveFilter',
          'sensitiveWords',
          'sensitiveWordAction',
          'dailyPostLimit',
          'dailyCommentLimit',
          'allowAnonymous',
          'maxImagesPerPost',
          'maxImageSize',
          'allowedImageTypes',
          'maxReplyLevel',
          'configUpdateInterval'
        ]
      }
    });

    // 转换为前端需要的格式
    const rules = {};
    settings.forEach(setting => {
      let value = setting.value;
      if (setting.type === 'boolean') {
        value = value === 'true';
      } else if (setting.type === 'number') {
        value = parseInt(value, 10) || 0;
      }
      rules[setting.key] = value;
    });

    // 设置默认值（确保数字类型正确）
    const contentRules = {
      minPostLength: Number(rules.minPostLength) || 5,
      maxPostLength: Number(rules.maxPostLength) || 1000,
      enableSensitiveFilter: Boolean(rules.enableSensitiveFilter),
      sensitiveWords: rules.sensitiveWords ? rules.sensitiveWords.split(',').map(w => w.trim()).filter(w => w) : [],
      sensitiveWordAction: rules.sensitiveWordAction || 'block',
      dailyPostLimit: Number(rules.dailyPostLimit) || 10,
      dailyCommentLimit: Number(rules.dailyCommentLimit) || 50,
      allowAnonymous: rules.allowAnonymous !== undefined ? Boolean(rules.allowAnonymous) : true,
      maxImagesPerPost: Number(rules.maxImagesPerPost) || 9,
      maxImageSize: Number(rules.maxImageSize) || 5,
      allowedImageTypes: rules.allowedImageTypes ? rules.allowedImageTypes.split(',').map(t => t.trim()).filter(t => t) : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxReplyLevel: Number(rules.maxReplyLevel) || 3,
      configUpdateInterval: Number(rules.configUpdateInterval) || 5 // 配置更新间隔（分钟），默认5分钟
    };

    // 更新下载统计（只有实际下载配置时才统计）
    const versionSetting = await Setting.findOne({
      where: { key: 'configVersion' }
    });

    if (versionSetting) {
      const versionInfo = JSON.parse(versionSetting.value);
      versionInfo.downloadCount = (versionInfo.downloadCount || 0) + 1;

      await Setting.update(
        { value: JSON.stringify(versionInfo) },
        { where: { key: 'configVersion' } }
      );
    }

    res.json({
      code: 0,
      message: '获取验证规则成功',
      data: contentRules
    });
  } catch (error) {
    console.error('获取验证规则失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取验证规则失败',
      data: null
    });
  }
});

// API状态检查路由
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 健康检查
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 重置强制更新标志的临时接口（仅用于调试）
router.post('/api/reset-force-update', async (req, res) => {
  try {
    const { Setting } = require('../models');

    // 获取当前配置版本信息
    const versionSetting = await Setting.findOne({
      where: { key: 'configVersion' }
    });

    if (!versionSetting) {
      return res.status(404).json({
        code: 404,
        message: '未找到配置版本信息',
        data: null
      });
    }

    const versionInfo = JSON.parse(versionSetting.value);

    // 重置强制更新标志
    versionInfo.forceUpdate = false;
    versionInfo.updateTime = new Date().toISOString();

    // 更新数据库
    await Setting.update(
      { value: JSON.stringify(versionInfo) },
      { where: { key: 'configVersion' } }
    );

    res.json({
      code: 0,
      message: '强制更新标志已重置',
      data: versionInfo
    });
  } catch (error) {
    console.error('重置强制更新标志失败:', error);
    res.status(500).json({
      code: 500,
      message: '重置失败',
      data: null
    });
  }
});

// 重置强制更新标志的临时接口（仅用于调试）
router.post('/api/reset-force-update', async (req, res) => {
  try {
    const { Setting } = require('../models');

    // 获取当前配置版本信息
    const versionSetting = await Setting.findOne({
      where: { key: 'configVersion' }
    });

    if (!versionSetting) {
      return res.status(404).json({
        code: 404,
        message: '未找到配置版本信息',
        data: null
      });
    }

    const versionInfo = JSON.parse(versionSetting.value);

    // 重置强制更新标志
    versionInfo.forceUpdate = false;
    versionInfo.updateTime = new Date().toISOString();

    // 更新数据库
    await Setting.update(
      { value: JSON.stringify(versionInfo) },
      { where: { key: 'configVersion' } }
    );

    res.json({
      code: 0,
      message: '强制更新标志已重置',
      data: versionInfo
    });
  } catch (error) {
    console.error('重置强制更新标志失败:', error);
    res.status(500).json({
      code: 500,
      message: '重置失败',
      data: null
    });
  }
});

module.exports = router;