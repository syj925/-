/**
 * 标签控制器
 * 处理标签的CRUD操作
 */
const { Tag, User } = require('../models/associations');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * @desc    获取标签列表
 * @route   GET /api/tags
 * @access  Public
 */
exports.getTags = catchAsync(async (req, res, next) => {
  // 解析查询参数
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const category = req.query.category || '';
  const status = req.query.status || '';
  const search = req.query.search || '';
  
  // 计算跳过的记录数
  const offset = (page - 1) * limit;
  
  // 构建搜索条件
  const whereCondition = {};
  
  // 如果有分类筛选
  if (category) {
    whereCondition.category = category;
  }
  
  // 如果有状态筛选
  if (status) {
    whereCondition.status = status;
  } else {
    // 默认不显示禁用的标签
    whereCondition.status = {
      [Op.ne]: 'disabled'
    };
  }
  
  // 如果有搜索关键词，添加搜索条件
  if (search) {
    whereCondition.name = {
      [Op.like]: `%${search}%`
    };
  }
  
  // 查询标签列表
  const { count, rows: tags } = await Tag.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ],
    order: [
      ['status', 'ASC'], // 热门在前
      ['sortOrder', 'ASC'], // 按排序顺序
      ['usageCount', 'DESC'], // 使用次数多的在前
      ['created_at', 'DESC'] // 新创建的在前
    ],
    limit,
    offset
  });
  
  // 计算总页数
  const totalPages = Math.ceil(count / limit);
  
  // 响应数据
  res.status(200).json({
    success: true,
    data: {
      tags,
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages
      }
    }
  });
});

/**
 * @desc    获取标签详情
 * @route   GET /api/tags/:id
 * @access  Public
 */
exports.getTag = catchAsync(async (req, res, next) => {
  // 获取标签ID
  const tagId = req.params.id;
  
  // 查询标签
  const tag = await Tag.findOne({
    where: {
      id: tagId
    },
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }
    ]
  });
  
  // 如果标签不存在
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: '标签不存在'
    });
  }
  
  // 响应数据
  res.status(200).json({
    success: true,
    data: tag
  });
});

/**
 * @desc    创建标签
 * @route   POST /api/tags
 * @access  Private (Admin)
 */
exports.createTag = catchAsync(async (req, res, next) => {
  // 获取请求数据
  const { name, category, description, color, status, sortOrder } = req.body;
  
  // 验证必要字段
  if (!name) {
    return res.status(400).json({
      success: false,
      message: '请提供标签名称'
    });
  }
  
  // 检查标签是否已存在
  const existingTag = await Tag.findOne({
    where: {
      name,
      deleted_at: null // 排除已删除的标签
    }
  });
  
  if (existingTag) {
    return res.status(400).json({
      success: false,
      message: '标签已存在'
    });
  }
  
  // 获取当前用户ID作为创建者
  const creatorId = req.user ? req.user.id : null;
  
  // 创建标签
  const tag = await Tag.create({
    name,
    category: category || 'interest',
    description: description || null,
    color: color || '#2196f3',
    status: status || 'normal',
    sortOrder: sortOrder || 0,
    creatorId
  });
  
  // 响应数据
  res.status(201).json({
    success: true,
    message: '标签创建成功',
    data: tag
  });
});

/**
 * @desc    更新标签
 * @route   PUT /api/tags/:id
 * @access  Private (Admin)
 */
exports.updateTag = catchAsync(async (req, res, next) => {
  // 获取标签ID
  const tagId = req.params.id;
  
  // 获取请求数据
  const { name, category, description, color, status, sortOrder } = req.body;
  
  // 查询标签
  const tag = await Tag.findByPk(tagId);
  
  // 如果标签不存在
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: '标签不存在'
    });
  }
  
  // 如果更改了名称，检查名称是否已存在
  if (name && name !== tag.name) {
    const existingTag = await Tag.findOne({
      where: {
        name,
        id: {
          [Op.ne]: tagId // 排除当前标签
        },
        deleted_at: null // 排除已删除的标签
      }
    });
    
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: '标签名称已存在'
      });
    }
  }
  
  // 更新标签数据
  if (name) tag.name = name;
  if (category) tag.category = category;
  if (description !== undefined) tag.description = description;
  if (color) tag.color = color;
  if (status) tag.status = status;
  if (sortOrder !== undefined) tag.sortOrder = sortOrder;
  
  // 保存更新
  await tag.save();
  
  // 响应数据
  res.status(200).json({
    success: true,
    message: '标签更新成功',
    data: tag
  });
});

/**
 * @desc    删除标签
 * @route   DELETE /api/tags/:id
 * @access  Private (Admin)
 */
exports.deleteTag = catchAsync(async (req, res, next) => {
  // 获取标签ID
  const tagId = req.params.id;
  
  // 查询标签
  const tag = await Tag.findByPk(tagId);
  
  // 如果标签不存在
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: '标签不存在'
    });
  }
  
  // 软删除标签
  await tag.destroy();
  
  // 响应数据
  res.status(200).json({
    success: true,
    message: '标签删除成功'
  });
});

/**
 * @desc    获取热门标签
 * @route   GET /api/tags/hot
 * @access  Public
 */
exports.getHotTags = catchAsync(async (req, res, next) => {
  // 解析查询参数
  const limit = parseInt(req.query.limit, 10) || 10;
  
  // 查询热门标签
  const tags = await Tag.findAll({
    where: {
      status: 'hot'
    },
    order: [
      ['sortOrder', 'ASC'], // 按排序顺序
      ['usageCount', 'DESC'] // 使用次数多的在前
    ],
    limit
  });
  
  // 响应数据
  res.status(200).json({
    success: true,
    data: tags
  });
});

/**
 * @desc    设置/取消热门标签
 * @route   PUT /api/tags/:id/hot
 * @access  Private (Admin)
 */
exports.toggleHot = catchAsync(async (req, res, next) => {
  // 获取标签ID
  const tagId = req.params.id;
  
  // 查询标签
  const tag = await Tag.findByPk(tagId);
  
  // 如果标签不存在
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: '标签不存在'
    });
  }
  
  // 切换热门状态
  const newStatus = tag.status === 'hot' ? 'normal' : 'hot';
  tag.status = newStatus;
  
  // 保存更新
  await tag.save();
  
  // 响应数据
  res.status(200).json({
    success: true,
    message: newStatus === 'hot' ? '已设为热门标签' : '已取消热门标签',
    data: {
      id: tag.id,
      status: tag.status
    }
  });
});

/**
 * @desc    设置/取消禁用标签
 * @route   PUT /api/tags/:id/status
 * @access  Private (Admin)
 */
exports.toggleStatus = catchAsync(async (req, res, next) => {
  // 获取标签ID
  const tagId = req.params.id;
  
  // 查询标签
  const tag = await Tag.findByPk(tagId);
  
  // 如果标签不存在
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: '标签不存在'
    });
  }
  
  // 切换禁用状态
  const newStatus = tag.status === 'disabled' ? 'normal' : 'disabled';
  tag.status = newStatus;
  
  // 保存更新
  await tag.save();
  
  // 响应数据
  res.status(200).json({
    success: true,
    message: newStatus === 'disabled' ? '标签已禁用' : '标签已启用',
    data: {
      id: tag.id,
      status: tag.status
    }
  });
});

/**
 * @desc    根据分类获取标签
 * @route   GET /api/tags/category/:category
 * @access  Public
 */
exports.getTagsByCategory = catchAsync(async (req, res, next) => {
  // 获取分类
  const category = req.params.category;
  
  // 验证分类是否有效
  const validCategories = ['interest', 'skill', 'major', 'grade', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: '无效的分类'
    });
  }
  
  // 解析查询参数
  const limit = parseInt(req.query.limit, 10) || 50;
  
  // 查询指定分类的标签
  const tags = await Tag.findAll({
    where: {
      category,
      status: {
        [Op.ne]: 'disabled' // 排除已禁用的标签
      }
    },
    order: [
      ['status', 'ASC'], // 热门在前
      ['sortOrder', 'ASC'], // 按排序顺序
      ['usageCount', 'DESC'] // 使用次数多的在前
    ],
    limit
  });
  
  // 响应数据
  res.status(200).json({
    success: true,
    data: tags
  });
}); 