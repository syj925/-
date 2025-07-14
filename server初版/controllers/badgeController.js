const { User, Badge, UserBadge } = require('../models/associations');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 获取标签列表
 * @route GET /api/admin/badges
 * @access 仅限管理员
 */
exports.getBadges = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Badge.findAndCountAll({
      offset,
      limit,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        total: count,
        items: rows,
        page,
        limit
      },
      message: '获取标签列表成功'
    });
  } catch (error) {
    logger.error('获取标签列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取标签列表失败',
      error: error.message
    });
  }
};

/**
 * 获取单个标签
 * @route GET /api/admin/badges/:id
 * @access 仅限管理员
 */
exports.getBadge = async (req, res) => {
  try {
    const badgeId = req.params.id;
    const badge = await Badge.findByPk(badgeId);
    
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: '未找到该标签'
      });
    }
    
    res.json({
      success: true,
      data: badge,
      message: '获取标签成功'
    });
  } catch (error) {
    logger.error('获取标签失败:', error);
    res.status(500).json({
      success: false,
      message: '获取标签失败',
      error: error.message
    });
  }
};

/**
 * 创建标签
 * @route POST /api/admin/badges
 * @access 仅限管理员
 */
exports.createBadge = async (req, res) => {
  try {
    const { name, description, color, status } = req.body;
    
    // 检查是否已存在同名标签
    const existingBadge = await Badge.findOne({ where: { name } });
    if (existingBadge) {
      return res.status(400).json({
        success: false,
        message: '已存在同名标签'
      });
    }
    
    // 创建新标签
    const newBadge = await Badge.create({
      name,
      description,
      color,
      status: status !== undefined ? status : true
    });
    
    res.status(201).json({
      success: true,
      data: newBadge,
      message: '创建标签成功'
    });
  } catch (error) {
    logger.error('创建标签失败:', error);
    res.status(500).json({
      success: false,
      message: '创建标签失败',
      error: error.message
    });
  }
};

/**
 * 更新标签
 * @route PUT /api/admin/badges/:id
 * @access 仅限管理员
 */
exports.updateBadge = async (req, res) => {
  try {
    const badgeId = req.params.id;
    const { name, description, color, status } = req.body;
    
    // 检查标签是否存在
    const badge = await Badge.findByPk(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: '未找到该标签'
      });
    }
    
    // 如果要更改名称，检查是否与其他标签重名
    if (name && name !== badge.name) {
      const existingBadge = await Badge.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: badgeId }
        } 
      });
      
      if (existingBadge) {
        return res.status(400).json({
          success: false,
          message: '已存在同名标签'
        });
      }
    }
    
    // 更新标签
    await badge.update({
      name: name || badge.name,
      description: description !== undefined ? description : badge.description,
      color: color || badge.color,
      status: status !== undefined ? status : badge.status
    });
    
    res.json({
      success: true,
      data: badge,
      message: '更新标签成功'
    });
  } catch (error) {
    logger.error('更新标签失败:', error);
    res.status(500).json({
      success: false,
      message: '更新标签失败',
      error: error.message
    });
  }
};

/**
 * 更新标签状态
 * @route PUT /api/admin/badges/:id/status
 * @access 仅限管理员
 */
exports.updateBadgeStatus = async (req, res) => {
  try {
    const badgeId = req.params.id;
    const { status } = req.body;
    
    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少状态参数'
      });
    }
    
    // 检查标签是否存在
    const badge = await Badge.findByPk(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: '未找到该标签'
      });
    }
    
    // 更新标签状态
    await badge.update({ status });
    
    res.json({
      success: true,
      data: badge,
      message: `标签已${status ? '启用' : '禁用'}`
    });
  } catch (error) {
    logger.error('更新标签状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新标签状态失败',
      error: error.message
    });
  }
};

/**
 * 删除标签
 * @route DELETE /api/admin/badges/:id
 * @access 仅限管理员
 */
exports.deleteBadge = async (req, res) => {
  try {
    const badgeId = req.params.id;
    
    // 检查标签是否存在
    const badge = await Badge.findByPk(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: '未找到该标签'
      });
    }
    
    // 删除关联的用户标签
    await UserBadge.destroy({ where: { badgeId } });
    
    // 删除标签
    await badge.destroy();
    
    res.json({
      success: true,
      message: '删除标签成功'
    });
  } catch (error) {
    logger.error('删除标签失败:', error);
    res.status(500).json({
      success: false,
      message: '删除标签失败',
      error: error.message
    });
  }
};

/**
 * 获取用户的标签
 * @route GET /api/admin/users/:userId/badges
 * @access 仅限管理员
 */
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 检查用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取用户标签
    const userBadges = await UserBadge.findAll({
      where: { userId },
      include: [
        {
          model: Badge,
          as: 'badge',
          attributes: ['id', 'name', 'description', 'color', 'status']
        }
      ]
    });
    
    // 提取标签信息
    const badges = userBadges.map(ub => ub.badge).filter(badge => badge !== null);

    res.json({
      success: true,
      data: badges,
      message: '获取用户标签成功'
    });
  } catch (error) {
    logger.error('获取用户标签失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户标签失败',
      error: error.message
    });
  }
};

/**
 * 为用户添加标签
 * @route POST /api/admin/users/:userId/badges
 * @access 仅限管理员
 */
exports.addUserBadge = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { badgeId } = req.body;
    
    if (!badgeId) {
      return res.status(400).json({
        success: false,
        message: '缺少标签ID参数'
      });
    }
    
    // 检查用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到该用户'
      });
    }
    
    // 检查标签是否存在
    const badge = await Badge.findByPk(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: '未找到该标签'
      });
    }
    
    // 检查用户是否已有该标签
    const existingUserBadge = await UserBadge.findOne({
      where: { userId, badgeId }
    });
    
    if (existingUserBadge) {
      return res.status(400).json({
        success: false,
        message: '用户已拥有该标签'
      });
    }
    
    // 为用户添加标签
    const userBadge = await UserBadge.create({
      userId,
      badgeId
    });
    
    res.status(201).json({
      success: true,
      data: {
        userId,
        badgeId,
        badge: {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          color: badge.color
        }
      },
      message: '添加用户标签成功'
    });
  } catch (error) {
    logger.error('添加用户标签失败:', error);
    res.status(500).json({
      success: false,
      message: '添加用户标签失败',
      error: error.message
    });
  }
};

/**
 * 从用户移除标签
 * @route DELETE /api/admin/users/:userId/badges/:badgeId
 * @access 仅限管理员
 */
exports.removeUserBadge = async (req, res) => {
  try {
    const userId = req.params.userId;
    const badgeId = req.params.badgeId;
    
    // 检查用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到该用户'
      });
    }
    
    // 检查用户是否拥有该标签
    const userBadge = await UserBadge.findOne({
      where: { userId, badgeId }
    });
    
    if (!userBadge) {
      return res.status(404).json({
        success: false,
        message: '用户未拥有该标签'
      });
    }
    
    // 移除用户标签
    await userBadge.destroy();
    
    res.json({
      success: true,
      message: '移除用户标签成功'
    });
  } catch (error) {
    logger.error('移除用户标签失败:', error);
    res.status(500).json({
      success: false,
      message: '移除用户标签失败',
      error: error.message
    });
  }
};

/**
 * 前台获取用户标签
 * @route GET /api/users/:id/badges
 * @access 公开
 */
exports.getUserBadgesPublic = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 获取该用户所有激活的标签
    const userBadges = await UserBadge.findAll({
      where: { userId },
      include: [
        {
          model: Badge,
          as: 'badge',
          where: { status: true }, // 只获取已启用的标签
          attributes: ['id', 'name', 'description', 'color']
        }
      ]
    });
    
    // 提取标签信息
    const badges = userBadges
      .filter(ub => ub.badge)
      .map(ub => ub.badge);

    res.json({
      success: true,
      data: badges,
      message: '获取用户标签成功'
    });
  } catch (error) {
    logger.error('获取用户标签失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户标签失败',
      error: error.message
    });
  }
}; 