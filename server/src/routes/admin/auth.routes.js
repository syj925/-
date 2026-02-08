const express = require('express');
const Joi = require('joi');

const adminAuthController = require('../../controllers/admin/auth.controller');
const AdminMiddleware = require('../../middlewares/admin.middleware');
const { Validator } = require('../../utils');

const publicRouter = express.Router();
const protectedRouter = express.Router();

const adminLoginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.empty': '用户名不能为空',
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多50个字符',
    'any.required': '用户名是必填项'
  }),
  password: Joi.string().min(6).max(30).required().messages({
    'string.empty': '密码不能为空',
    'string.min': '密码至少6个字符',
    'string.max': '密码最多30个字符',
    'any.required': '密码是必填项'
  })
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': '旧密码不能为空',
    'any.required': '旧密码是必填项'
  }),
  newPassword: Joi.string().min(6).max(30).required().messages({
    'string.empty': '新密码不能为空',
    'string.min': '新密码至少6个字符',
    'string.max': '新密码最多30个字符',
    'any.required': '新密码是必填项'
  })
});

publicRouter.post(
  '/login',
  AdminMiddleware.formatResponse(),
  AdminMiddleware.logOperation(),
  Validator.validateBody(adminLoginSchema),
  adminAuthController.login
);

protectedRouter.post('/logout', adminAuthController.logout);
protectedRouter.get('/profile', adminAuthController.getCurrentAdmin);
protectedRouter.post('/refresh-token', adminAuthController.refreshToken);
protectedRouter.put(
  '/change-password',
  Validator.validateBody(changePasswordSchema),
  adminAuthController.changePassword
);

module.exports = {
  publicRouter,
  protectedRouter
};
