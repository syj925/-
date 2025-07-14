/**
 * 内容管理相关路由
 * 处理banner和分类的CRUD操作
 */
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { auth, checkRole } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { bannerValidation, categoryValidation } = require('../validations/contentValidation');
const cache = require('../utils/cache');

// 公开路由 - 不需要身份验证
// Banner相关路由
router.get('/banners', contentController.getBanners);
router.get('/banners/:id', contentController.getBannerById);

// 开发/调试用路由 - 清除分类缓存
router.get('/debug/clear-category-cache', async (req, res) => {
  try {
    console.log('手动清除分类缓存');
    await cache.deletePattern('category:*');
    return res.json({ success: true, message: '分类缓存已清除' });
  } catch (error) {
    console.error('清除缓存失败:', error);
    return res.status(500).json({ success: false, message: '清除缓存失败' });
  }
});

// 分类相关路由 - 注意路由顺序很重要
router.get('/categories/type/:type', contentController.getCategoriesByType);
router.get('/categories/:id', contentController.getCategoryById);
router.get('/categories', contentController.getCategories);

// 需要管理员权限的路由
// Banner管理
router.post(
  '/admin/banners',
  auth,
  checkRole(['admin']),
  validate(bannerValidation.createBanner),
  contentController.createBanner
);

router.put(
  '/admin/banners/:id',
  auth,
  checkRole(['admin']),
  validate(bannerValidation.updateBanner),
  contentController.updateBanner
);

router.delete(
  '/admin/banners/:id',
  auth,
  checkRole(['admin']),
  contentController.deleteBanner
);

// 分类管理
router.post(
  '/admin/categories',
  auth,
  checkRole(['admin']),
  validate(categoryValidation.createCategory),
  contentController.createCategory
);

router.put(
  '/admin/categories/:id',
  auth,
  checkRole(['admin']),
  validate(categoryValidation.updateCategory),
  contentController.updateCategory
);

router.delete(
  '/admin/categories/:id',
  auth,
  checkRole(['admin']),
  contentController.deleteCategory
);

module.exports = router; 