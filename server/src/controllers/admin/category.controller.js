const categoryRepository = require('../../repositories/category.repository');
const categoryStatsService = require('../../services/category-stats.service');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../../config/logger');

/**
 * 管理员分类管理控制器
 */
class AdminCategoryController {
  /**
   * 获取分类列表
   */
  async getCategoryList(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        orderBy = 'sort', 
        orderDirection = 'ASC' 
      } = req.query;

      const categories = await categoryRepository.findAllWithStats();
      
      // 搜索过滤
      let filteredCategories = categories;
      if (search) {
        filteredCategories = categories.filter(category => 
          category.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // 排序
      filteredCategories.sort((a, b) => {
        const aValue = a[orderBy] || 0;
        const bValue = b[orderBy] || 0;
        
        if (orderDirection === 'DESC') {
          return bValue - aValue;
        }
        return aValue - bValue;
      });

      // 分页
      const total = filteredCategories.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

      // 为了兼容前端，返回前端期望的格式
      const formattedCategories = paginatedCategories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        sort: category.sort || 0,
        postCount: category.post_count || 0, // 前端期望的字段名
        status: category.status === 'enabled' ? 'active' : 'inactive',
        enabled: category.status === 'enabled',
        createdAt: category.created_at,
        updatedAt: category.updated_at
      }));

      res.status(StatusCodes.OK).json({
        items: formattedCategories,
        totalItems: total
      });
    } catch (error) {
      logger.error('获取分类列表失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '获取分类列表失败',
        error: error.message
      });
    }
  }

  /**
   * 创建分类
   */
  async createCategory(req, res) {
    try {
      const { name, icon, sort = 0 } = req.body;

      if (!name) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类名称不能为空'
        });
      }

      // 检查分类名称是否已存在
      const existingCategory = await categoryRepository.findByName(name);
      if (existingCategory) {
        return res.status(StatusCodes.CONFLICT).json({
          code: 1,
          msg: '分类名称已存在'
        });
      }

      const categoryData = {
        name: name.trim(),
        icon: icon || '',
        sort: parseInt(sort),
        post_count: 0,
        status: 'enabled'
      };

      const category = await categoryRepository.create(categoryData);

      logger.info('管理员创建分类成功', {
        adminId: req.user?.id,
        categoryId: category.id,
        categoryName: category.name
      });

      res.status(StatusCodes.CREATED).json({
        code: 0,
        msg: '创建分类成功',
        data: category
      });
    } catch (error) {
      logger.error('创建分类失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '创建分类失败',
        error: error.message
      });
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, icon, sort, status } = req.body;

      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类ID不能为空'
        });
      }

      // 检查分类是否存在
      const category = await categoryRepository.findById(id);
      if (!category) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: 1,
          msg: '分类不存在'
        });
      }

      // 如果修改了名称，检查新名称是否已存在
      if (name && name !== category.name) {
        const existingCategory = await categoryRepository.findByName(name);
        if (existingCategory && existingCategory.id !== parseInt(id)) {
          return res.status(StatusCodes.CONFLICT).json({
            code: 1,
            msg: '分类名称已存在'
          });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (icon !== undefined) updateData.icon = icon;
      if (sort !== undefined) updateData.sort = parseInt(sort);
      if (status !== undefined) {
        // 处理前端发送的数值状态：1=启用，0=禁用
        if (typeof status === 'number') {
          updateData.status = status === 1 ? 'enabled' : 'disabled';
        } else if (typeof status === 'string') {
          // 处理字符串状态
          updateData.status = status === 'active' ? 'enabled' : 'disabled';
        } else {
          updateData.status = status;
        }
      }

      const updatedCategory = await categoryRepository.update(id, updateData);

      logger.info('管理员更新分类成功', {
        adminId: req.user?.id,
        categoryId: id,
        updateData
      });

      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '更新分类成功',
        data: updatedCategory
      });
    } catch (error) {
      logger.error('更新分类失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '更新分类失败',
        error: error.message
      });
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类ID不能为空'
        });
      }

      // 检查分类是否存在
      const category = await categoryRepository.findById(id);
      if (!category) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: 1,
          msg: '分类不存在'
        });
      }

      // 检查分类下是否有帖子
      if (category.post_count > 0) {
        return res.status(StatusCodes.CONFLICT).json({
          code: 1,
          msg: `该分类下还有 ${category.post_count} 个帖子，无法删除`
        });
      }

      await categoryRepository.delete(id);

      logger.info('管理员删除分类成功', {
        adminId: req.user?.id,
        categoryId: id,
        categoryName: category.name
      });

      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '删除分类成功'
      });
    } catch (error) {
      logger.error('删除分类失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '删除分类失败',
        error: error.message
      });
    }
  }

  /**
   * 获取分类详情
   */
  async getCategoryDetail(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类ID不能为空'
        });
      }

      const category = await categoryRepository.findById(id);
      if (!category) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: 1,
          msg: '分类不存在'
        });
      }

      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '获取分类详情成功',
        data: category
      });
    } catch (error) {
      logger.error('获取分类详情失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '获取分类详情失败',
        error: error.message
      });
    }
  }

  /**
   * 批量更新分类排序
   */
  async updateCategoriesSort(req, res) {
    try {
      const { categories } = req.body;

      if (!Array.isArray(categories)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类数据格式错误'
        });
      }

      // 批量更新排序
      for (const categoryData of categories) {
        if (categoryData.id && categoryData.sort !== undefined) {
          await categoryRepository.update(categoryData.id, {
            sort: parseInt(categoryData.sort)
          });
        }
      }

      logger.info('管理员批量更新分类排序成功', {
        adminId: req.user?.id,
        categoriesCount: categories.length
      });

      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '更新分类排序成功'
      });
    } catch (error) {
      logger.error('更新分类排序失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '更新分类排序失败',
        error: error.message
      });
    }
  }

  /**
   * 启用分类
   */
  async enableCategory(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类ID不能为空'
        });
      }

      // 检查分类是否存在
      const category = await categoryRepository.findById(id);
      if (!category) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: 1,
          msg: '分类不存在'
        });
      }

      await categoryRepository.update(id, { status: 'enabled' });

      logger.info('管理员启用分类成功', {
        adminId: req.user?.id,
        categoryId: id,
        categoryName: category.name
      });

      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '启用分类成功'
      });
    } catch (error) {
      logger.error('启用分类失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '启用分类失败',
        error: error.message
      });
    }
  }

  /**
   * 禁用分类
   */
  async disableCategory(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: 1,
          msg: '分类ID不能为空'
        });
      }

      // 检查分类是否存在
      const category = await categoryRepository.findById(id);
      if (!category) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: 1,
          msg: '分类不存在'
        });
      }

      await categoryRepository.update(id, { status: 'disabled' });

      logger.info('管理员禁用分类成功', {
        adminId: req.user?.id,
        categoryId: id,
        categoryName: category.name
      });

      res.status(StatusCodes.OK).json({
        code: 0,
        msg: '禁用分类成功'
      });
    } catch (error) {
      logger.error('禁用分类失败:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: 1,
        msg: '禁用分类失败',
        error: error.message
      });
    }
  }
}

module.exports = new AdminCategoryController();
