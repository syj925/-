const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');
const { Validator } = require('../utils');
const Joi = require('joi');

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
router.get('/', 
  AuthMiddleware.authenticate(), 
  settingsController.getUserSettings
);

router.put('/', 
  AuthMiddleware.authenticate(), 
  Validator.validateBody(userSettingsSchema),
  settingsController.updateUserSettings
);

// 隐私设置路由
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
