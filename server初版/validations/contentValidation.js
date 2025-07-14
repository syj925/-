/**
 * 内容管理模块的验证规则
 * 包括Banner和Category的验证
 */
const { body } = require('express-validator');

// Banner验证规则
const bannerValidation = {
  // 创建Banner的验证规则
  createBanner: [
    body('title')
      .isLength({ min: 2, max: 100 })
      .withMessage('标题长度必须在2-100个字符之间'),
    
    body('image')
      .custom(value => {
        // 允许完整URL或相对路径
        return true;
      })
      .withMessage('图片URL格式不正确'),
    
    body('url')
      .optional({ nullable: true })
      .custom(value => {
        // 如果提供了值且不为空，则进行验证
        if (value && value.trim() !== '') {
          // 检查是否是有效URL
          try {
            new URL(value.startsWith('http') ? value : `http://${value}`);
            return true;
          } catch (e) {
            return false;
          }
        }
        return true;
      })
      .withMessage('链接URL格式不正确'),
    
    body('type')
      .isIn(['post', 'topic', 'event', 'url'])
      .withMessage('类型必须是post、topic、event或url之一'),
    
    body('targetId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('目标ID必须是整数'),
    
    body('platform')
      .isIn(['app', 'web', 'admin', 'all'])
      .withMessage('平台必须是app、web、admin或all之一'),
    
    body('sort')
      .optional()
      .isInt({ min: 0 })
      .withMessage('排序值必须是非负整数'),
    
    body('status')
      .isIn(['active', 'inactive'])
      .withMessage('状态必须是active或inactive'),
    
    body('startTime')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('开始时间格式不正确，应为ISO8601格式'),
    
    body('endTime')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('结束时间格式不正确，应为ISO8601格式')
      .custom((value, { req }) => {
        if (req.body.startTime && value && new Date(value) <= new Date(req.body.startTime)) {
          throw new Error('结束时间必须晚于开始时间');
        }
        return true;
      })
  ],

  // 更新Banner的验证规则
  updateBanner: [
    body('title')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('标题长度必须在2-100个字符之间'),
    
    body('image')
      .optional()
      .custom(value => {
        // 允许完整URL或相对路径
        return true;
      })
      .withMessage('图片URL格式不正确'),
    
    body('url')
      .optional({ nullable: true })
      .custom(value => {
        // 如果提供了值且不为空，则进行验证
        if (value && value.trim() !== '') {
          // 检查是否是有效URL
          try {
            new URL(value.startsWith('http') ? value : `http://${value}`);
            return true;
          } catch (e) {
            return false;
          }
        }
        return true;
      })
      .withMessage('链接URL格式不正确'),
    
    body('type')
      .optional()
      .isIn(['post', 'topic', 'event', 'url'])
      .withMessage('类型必须是post、topic、event或url之一'),
    
    body('targetId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('目标ID必须是整数'),
    
    body('platform')
      .optional()
      .isIn(['app', 'web', 'admin', 'all'])
      .withMessage('平台必须是app、web、admin或all之一'),
    
    body('sort')
      .optional()
      .isInt({ min: 0 })
      .withMessage('排序值必须是非负整数'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('状态必须是active或inactive'),
    
    body('startTime')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('开始时间格式不正确，应为ISO8601格式'),
    
    body('endTime')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('结束时间格式不正确，应为ISO8601格式')
      .custom((value, { req }) => {
        if (req.body.startTime && value && new Date(value) <= new Date(req.body.startTime)) {
          throw new Error('结束时间必须晚于开始时间');
        }
        return true;
      })
  ]
};

// Category验证规则
const categoryValidation = {
  // 创建Category的验证规则
  createCategory: [
    body('name')
      .isLength({ min: 2, max: 50 })
      .withMessage('分类名称长度必须在2-50个字符之间'),
    
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('描述长度不能超过200个字符'),
    
    body('icon')
      .optional()
      .isURL()
      .withMessage('图标URL格式不正确'),
    
    body('bgColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('背景颜色必须是有效的十六进制颜色代码，例如#FF5733'),
    
    body('type')
      .isIn(['post', 'topic', 'event'])
      .withMessage('类型必须是post、topic或event之一'),
    
    body('sort')
      .optional()
      .isInt({ min: 0 })
      .withMessage('排序值必须是非负整数'),
    
    body('status')
      .isIn([0, 1])
      .withMessage('状态必须是0或1'),
    
    body('parentId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('父分类ID必须是整数')
  ],

  // 更新Category的验证规则
  updateCategory: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('分类名称长度必须在2-50个字符之间'),
    
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('描述长度不能超过200个字符'),
    
    body('icon')
      .optional()
      .isURL()
      .withMessage('图标URL格式不正确'),
    
    body('bgColor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('背景颜色必须是有效的十六进制颜色代码，例如#FF5733'),
    
    body('type')
      .optional()
      .isIn(['post', 'topic', 'event'])
      .withMessage('类型必须是post、topic或event之一'),
    
    body('sort')
      .optional()
      .isInt({ min: 0 })
      .withMessage('排序值必须是非负整数'),
    
    body('status')
      .optional()
      .isIn([0, 1])
      .withMessage('状态必须是0或1'),
    
    body('parentId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('父分类ID必须是整数')
  ]
};

module.exports = {
  bannerValidation,
  categoryValidation
}; 