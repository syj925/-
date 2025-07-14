/**
 * 内容管理控制器
 * 处理Banner和Category的CRUD操作
 */
const { Op } = require('sequelize');
const db = require('../models/associations');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const { getPagination, getPagingData } = require('../utils/pagination');

// 获取模型实例
const { sequelize, Banner, Category } = db;

// 缓存键前缀
const CACHE_PREFIX = {
  BANNER: 'banner:',
  CATEGORY: 'category:'
};

// 缓存失效时间（秒）
const CACHE_TTL = {
  BANNER: 3600, // 1小时
  CATEGORY: 7200 // 2小时
};

/**
 * 获取所有Banner
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.getBanners = async (req, res, next) => {
  try {
    const { platform = 'all', status = 'active', limit = 5, page = 1 } = req.query;
    const cacheKey = `${CACHE_PREFIX.BANNER}list:${platform}:${status}:${limit}:${page}`;
    
    // 尝试从缓存获取
    const cachedData = await cache.getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 构建查询条件
    const query = { where: {}, order: [['sort', 'DESC'], ['id', 'DESC']] };
    const { limit: limitVal, offset } = getPagination(page, limit);
    query.limit = limitVal;
    query.offset = offset;
    
    // 根据平台筛选
    if (platform !== 'all') {
      query.where.platform = {
        [Op.or]: [platform, 'all']
      };
    }
    
    // 根据状态筛选
    if (status !== undefined) {
      query.where.status = status;
    }
    
    // 筛选当前有效的Banner（根据时间）
    const now = new Date();
    query.where[Op.and] = [
      {
        [Op.or]: [
          { startTime: { [Op.lte]: now } },
          { startTime: null }
        ]
      },
      {
        [Op.or]: [
          { endTime: { [Op.gte]: now } },
          { endTime: null }
        ]
      }
    ];
    
    // 检查Banner模型是否可用
    if (!Banner || typeof Banner.findAndCountAll !== 'function') {
      logger.error('Banner模型未定义或findAndCountAll方法不可用');
      return res.status(500).json({ 
        message: 'Banner模型未初始化，无法获取数据' 
      });
    }
    
    // 执行查询
    const banners = await Banner.findAndCountAll(query);
    const response = getPagingData(banners, page, limit);
    
    // 缓存结果
    await cache.setCache(cacheKey, response, CACHE_TTL.BANNER);
    
    return res.json(response);
  } catch (error) {
    logger.error('获取Banner列表失败:', error);
    next(error);
  }
};

/**
 * 根据ID获取Banner
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.getBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `${CACHE_PREFIX.BANNER}id:${id}`;
    
    // 尝试从缓存获取
    const cachedData = await cache.getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 执行查询
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner不存在' });
    }
    
    // 缓存结果
    await cache.setCache(cacheKey, banner, CACHE_TTL.BANNER);
    
    return res.json(banner);
  } catch (error) {
    logger.error('获取Banner详情失败:', error);
    next(error);
  }
};

/**
 * 创建Banner
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.createBanner = async (req, res, next) => {
  try {
    const bannerData = req.body;
    const banner = await Banner.create(bannerData);
    
    // 清除相关缓存
    await cache.deletePattern(`${CACHE_PREFIX.BANNER}list:*`);
    
    return res.status(201).json({
      message: 'Banner创建成功',
      data: banner
    });
  } catch (error) {
    logger.error('创建Banner失败:', error);
    next(error);
  }
};

/**
 * 更新Banner
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bannerData = req.body;
    
    // 查找Banner
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner不存在' });
    }
    
    // 更新Banner
    await banner.update(bannerData);
    
    // 清除相关缓存
    await cache.deletePattern(`${CACHE_PREFIX.BANNER}list:*`);
    await cache.deleteCache(`${CACHE_PREFIX.BANNER}id:${id}`);
    
    return res.json({
      message: 'Banner更新成功',
      data: banner
    });
  } catch (error) {
    logger.error('更新Banner失败:', error);
    next(error);
  }
};

/**
 * 删除Banner
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 查找Banner
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner不存在' });
    }
    
    // 软删除Banner
    await banner.destroy();
    
    // 清除相关缓存
    await cache.deletePattern(`${CACHE_PREFIX.BANNER}list:*`);
    await cache.deleteCache(`${CACHE_PREFIX.BANNER}id:${id}`);
    
    return res.json({ message: 'Banner删除成功' });
  } catch (error) {
    logger.error('删除Banner失败:', error);
    next(error);
  }
};

/**
 * 获取所有分类
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.getCategories = async (req, res, next) => {
  try {
    const { type, parentId, status, page = 1, limit = 20, includeInactive } = req.query;
    console.log('getCategories被调用，原始参数:', { type, parentId, status, page, limit, includeInactive });
    
    const cacheKey = `${CACHE_PREFIX.CATEGORY}list:${type || 'all'}:${parentId || 'all'}:${status}:${page}:${limit}:${includeInactive || false}`;
    
    // 尝试从缓存获取
    const cachedData = await cache.getCache(cacheKey);
    if (cachedData) {
      console.log('返回缓存数据:', cachedData);
      return res.json(cachedData);
    }
    
    // 构建查询条件
    const query = { where: {}, order: [['sort', 'DESC'], ['id', 'ASC']] };
    const { limit: limitVal, offset } = getPagination(page, limit);
    query.limit = limitVal;
    query.offset = offset;
    
    // 根据类型筛选
    if (type) {
      query.where.type = type;
    }
    
    // 根据父分类ID筛选
    if (parentId === '0') {
      query.where.parentId = null;
    } else if (parentId) {
      query.where.parentId = parentId;
    }
    
    // 根据状态筛选 - 仅当includeInactive不为true时才添加status过滤条件
    if (status !== undefined && includeInactive !== 'true') {
      // 将数字状态转换为字符串枚举值
      if (status == 1) {
        query.where.status = 'active';
      } else if (status == 0) {
        query.where.status = 'inactive';
      } else {
        // 如果是字符串枚举值，直接使用
        query.where.status = status;
      }
    }
    
    console.log('最终查询条件:', JSON.stringify(query, null, 2));
    
    // 执行查询
    const categories = await Category.findAndCountAll(query);
    console.log('数据库返回的原始结果:', JSON.stringify(categories, null, 2));
    
    const response = getPagingData(categories, page, limit);
    console.log('格式化后的返回结果:', JSON.stringify(response, null, 2));
    
    // 缓存结果
    await cache.setCache(cacheKey, response, CACHE_TTL.CATEGORY);
    
    return res.json(response);
  } catch (error) {
    logger.error('获取分类列表失败:', error);
    next(error);
  }
};

/**
 * 根据类型获取分类
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.getCategoriesByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { status = 1 } = req.query;
    const cacheKey = `${CACHE_PREFIX.CATEGORY}type:${type}:${status}`;
    
    // 尝试从缓存获取
    const cachedData = await cache.getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 验证类型
    const validTypes = ['post', 'topic', 'event'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: '无效的分类类型' });
    }
    
    // 构建查询条件
    const query = {
      where: { type, status },
      order: [['sort', 'DESC'], ['id', 'ASC']]
    };
    
    // 执行查询
    const categories = await Category.findAll(query);
    
    // 构建树形结构
    const rootCategories = [];
    const categoryMap = {};
    
    // 创建映射
    categories.forEach(category => {
      categoryMap[category.id] = {
        ...category.toJSON(),
        children: []
      };
    });
    
    // 构建树
    categories.forEach(category => {
      const item = categoryMap[category.id];
      
      if (!category.parentId) {
        rootCategories.push(item);
      } else if (categoryMap[category.parentId]) {
        categoryMap[category.parentId].children.push(item);
      }
    });
    
    // 缓存结果
    await cache.setCache(cacheKey, rootCategories, CACHE_TTL.CATEGORY);
    
    return res.json(rootCategories);
  } catch (error) {
    logger.error('获取分类列表(按类型)失败:', error);
    next(error);
  }
};

/**
 * 根据ID获取分类
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `${CACHE_PREFIX.CATEGORY}id:${id}`;
    
    // 尝试从缓存获取
    const cachedData = await cache.getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 执行查询
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'children',
          where: { status: 1 },
          required: false
        }
      ]
    });
    
    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }
    
    // 缓存结果
    await cache.setCache(cacheKey, category, CACHE_TTL.CATEGORY);
    
    return res.json(category);
  } catch (error) {
    logger.error('获取分类详情失败:', error);
    next(error);
  }
};

/**
 * 创建分类
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = req.body;
    
    // 检查父分类是否存在
    if (categoryData.parentId) {
      const parentCategory = await Category.findByPk(categoryData.parentId);
      if (!parentCategory) {
        return res.status(400).json({ message: '父分类不存在' });
      }
      
      // 确保类型一致
      if (parentCategory.type !== categoryData.type) {
        return res.status(400).json({ message: '子分类类型必须与父分类一致' });
      }
    }
    
    // 转换status字段值，将数值转为字符串枚举
    if (categoryData.status !== undefined) {
      // 验证器接受0/1，需转换为'inactive'/'active'
      categoryData.status = categoryData.status === 1 ? 'active' : 'inactive';
      console.log(`转换分类状态值: 原始值=${req.body.status}, 转换后=${categoryData.status}`);
    }
    
    // 创建分类
    const category = await Category.create(categoryData);
    
    // 清除相关缓存
    await cache.deletePattern(`${CACHE_PREFIX.CATEGORY}list:*`);
    await cache.deletePattern(`${CACHE_PREFIX.CATEGORY}type:${categoryData.type}:*`);
    
    return res.status(201).json({
      message: '分类创建成功',
      data: category
    });
  } catch (error) {
    logger.error('创建分类失败:', error);
    next(error);
  }
};

/**
 * 更新分类
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    
    // 查找分类
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }
    
    // 检查父分类是否存在
    if (categoryData.parentId) {
      // 防止自身成为自己的父级
      if (parseInt(categoryData.parentId) === parseInt(id)) {
        return res.status(400).json({ message: '分类不能成为自身的父级' });
      }
      
      const parentCategory = await Category.findByPk(categoryData.parentId);
      if (!parentCategory) {
        return res.status(400).json({ message: '父分类不存在' });
      }
      
      // 确保类型一致（如果提供了类型）
      const type = categoryData.type || category.type;
      if (parentCategory.type !== type) {
        return res.status(400).json({ message: '子分类类型必须与父分类一致' });
      }
    }
    
    // 转换status字段值，将数值转为字符串枚举
    if (categoryData.status !== undefined) {
      // 验证器接受0/1，需转换为'inactive'/'active'
      categoryData.status = categoryData.status === 1 ? 'active' : 'inactive';
      console.log(`转换分类状态值: 原始值=${req.body.status}, 转换后=${categoryData.status}`);
    }
    
    // 更新分类
    await category.update(categoryData);
    
    // 清除相关缓存
    await cache.deletePattern(`${CACHE_PREFIX.CATEGORY}list:*`);
    await cache.deletePattern(`${CACHE_PREFIX.CATEGORY}type:${category.type}:*`);
    if (categoryData.type && categoryData.type !== category.type) {
      await cache.deletePattern(`${CACHE_PREFIX.CATEGORY}type:${categoryData.type}:*`);
    }
    await cache.deleteCache(`${CACHE_PREFIX.CATEGORY}id:${id}`);
    
    return res.json({
      message: '分类更新成功',
      data: category
    });
  } catch (error) {
    logger.error('更新分类失败:', error);
    next(error);
  }
};

/**
 * 删除分类
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 查找分类
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ message: '分类不存在' });
    }
    
    // 检查是否有子分类
    const childrenCount = await Category.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      return res.status(400).json({ message: '无法删除有子分类的分类，请先删除所有子分类' });
    }
    
    // 获取分类类型，用于后续清除缓存
    const categoryType = category.type;
    
    // 软删除分类
    await category.destroy();
    
    // 清除相关缓存
    await cache.deletePattern(`${CACHE_PREFIX.CATEGORY}list:*`);
    await cache.deletePattern(`${CACHE_PREFIX.CATEGORY}type:${categoryType}:*`);
    await cache.deleteCache(`${CACHE_PREFIX.CATEGORY}id:${id}`);
    
    return res.json({ message: '分类删除成功' });
  } catch (error) {
    logger.error('删除分类失败:', error);
    next(error);
  }
}; 