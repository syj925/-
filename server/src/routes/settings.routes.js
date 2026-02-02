const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');
const { Validator } = require('../utils');
const Joi = require('joi');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSettings:
 *       type: object
 *       properties:
 *         privacy:
 *           type: object
 *           properties:
 *             anonymousMode:
 *               type: boolean
 *             allowSearch:
 *               type: boolean
 *             showLocation:
 *               type: boolean
 *             allowFollow:
 *               type: boolean
 *             allowComment:
 *               type: boolean
 *             allowMessage:
 *               type: boolean
 *             favoriteVisible:
 *               type: boolean
 *             followListVisible:
 *               type: boolean
 *             fansListVisible:
 *               type: boolean
 */

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: 用户设置API
 */

/**
 * 隐私设置验证规则
 */
const privacySettingsSchema = Joi.object({
  anonymousMode: Joi.boolean(),
  allowSearch: Joi.boolean(),
  showLocation: Joi.boolean(),
  allowFollow: Joi.boolean(),
  allowComment: Joi.boolean(),
  allowMessage: Joi.boolean().description('是否允许接收私信'),
  favoriteVisible: Joi.boolean(),
  followListVisible: Joi.boolean(),
  fansListVisible: Joi.boolean()
});

/**
 * 用户设置验证规则
 */
const userSettingsSchema = Joi.object({
  privacy: privacySettingsSchema
});

// 用户设置路由
/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: 获取用户设置
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户设置
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSettings'
 *   put:
 *     summary: 更新用户设置
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSettings'
 *     responses:
 *       200:
 *         description: 更新成功
 * /api/settings/privacy:
 *   get:
 *     summary: 获取隐私设置
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 隐私设置
 *   put:
 *     summary: 更新隐私设置
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSettings'
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.get('/', 
  AuthMiddleware.authenticate(), 
  settingsController.getUserSettings
);

router.put('/', 
  AuthMiddleware.authenticate(), 
  Validator.validateBody(userSettingsSchema),
  settingsController.updateUserSettings
);

router.get('/privacy', 
  AuthMiddleware.authenticate(), 
  settingsController.getPrivacySettings
);

router.put('/privacy', 
  AuthMiddleware.authenticate(), 
  Validator.validateBody(privacySettingsSchema),
  settingsController.updatePrivacySettings
);

module.exports = router;
