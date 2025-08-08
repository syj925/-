const express = require('express');
const router = express.Router();
const adminCategoryController = require('../../controllers/admin/category.controller');

/**
 * 管理员分类管理路由
 */

// 获取分类列表
router.get('/', adminCategoryController.getCategoryList);

// 创建分类
router.post('/', adminCategoryController.createCategory);

// 获取分类详情
router.get('/:id', adminCategoryController.getCategoryDetail);

// 更新分类
router.put('/:id', adminCategoryController.updateCategory);

// 删除分类
router.delete('/:id', adminCategoryController.deleteCategory);

// 批量更新分类排序
router.put('/batch/sort', adminCategoryController.updateCategoriesSort);

// 启用分类
router.put('/:id/enable', adminCategoryController.enableCategory);

// 禁用分类
router.put('/:id/disable', adminCategoryController.disableCategory);

module.exports = router;
