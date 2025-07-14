const { User } = require('../models/associations');
const asyncHandler = require('express-async-handler');

/**
 * @desc    获取用户设置
 * @route   GET /api/users/settings
 * @access  Private
 */
exports.getUserSettings = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查询用户记录
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查用户设置
    // 如果settings字段是JSON类型，直接获取
    // 如果没有设置，返回默认设置
    const settings = user.settings || {
      privacy: {
        anonymousMode: false,
        allowSearch: true,
        showLocation: false
      }
    };
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取用户设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    更新用户设置
 * @route   PUT /api/users/settings
 * @access  Private
 */
exports.updateUserSettings = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { privacy } = req.body;
    
    // 查询用户记录
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取当前设置或初始化
    let currentSettings = user.settings || {};
    
    // 合并设置
    // 只更新提供的字段
    if (privacy) {
      currentSettings.privacy = {
        ...currentSettings.privacy,
        ...privacy
      };
    }
    
    // 更新用户设置
    user.settings = currentSettings;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '设置已更新',
      data: user.settings
    });
  } catch (error) {
    console.error('更新用户设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    修改用户密码
 * @route   PUT /api/users/password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // 验证请求
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供当前密码和新密码'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '两次输入的新密码不一致'
      });
    }
    
    // 查询用户
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 验证当前密码
    if (!user.checkPassword(currentPassword)) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '密码已更新'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    获取消息相关的系统设置
 * @route   GET /api/settings/message
 * @access  Public
 */
exports.getMessageSettings = asyncHandler(async (req, res) => {
  try {
    // 引入Setting模型
    const { Setting } = require('../models/associations');
    
    // 获取消息设置
    const messageReadDelaySeconds = await Setting.findOne({
      where: { key: 'readDelaySeconds' }
    });
    
    // 构建设置对象
    const settings = {
      // 如果找到设置则使用其值，否则使用默认值5秒
      readDelaySeconds: messageReadDelaySeconds ? parseInt(messageReadDelaySeconds.value) || 5 : 5
    };
    
    // 返回结果
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取消息设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取消息设置失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}); 