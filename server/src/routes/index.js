const express = require("express");
const router = express.Router();

// 引入各个模块的路由
const userRoutes = require("./user.routes");
const postRoutes = require("./post.routes");
const categoryRoutes = require("./category.routes");
const topicRoutes = require("./topic.routes");
const commentRoutes = require("./comment.routes");
const likeRoutes = require("./like.routes");
const favoriteRoutes = require("./favorite.routes");
const messageRoutes = require("./message.routes");
const privateMessageRoutes = require("./private-message.routes");
const followRoutes = require("./follow.routes");
const uploadRoutes = require("./upload.routes");
const adminRoutes = require("./admin.routes");
const searchRoutes = require("./search.routes");
const settingsRoutes = require("./settings.routes");
const eventRoutes = require("./event.routes");
const eventRegistrationRoutes = require("./event-registration.routes");
const bannerRoutes = require("./banner.routes");
const badgeRoutes = require("./badge.routes");
const tagRoutes = require("./tag.routes");
const emojiRoutes = require("./emoji.routes");
const userController = require("../controllers/user.controller");
const configController = require("../controllers/config.controller");
const { Validator } = require("../utils");
const Joi = require("joi");
const AdminMiddleware = require("../middlewares/admin.middleware");
// 后续将在此处引入其他路由

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: 用户ID
 *         username:
 *           type: string
 *           description: 用户名
 *         nickname:
 *           type: string
 *           description: 昵称
 *         avatar:
 *           type: string
 *           description: 头像URL
 *         role:
 *           type: string
 *           enum: [student, teacher, admin]
 *           description: 用户角色
 *     Post:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           description: 帖子ID
 *         content:
 *           type: string
 *           description: 帖子内容
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: 图片URL列表
 *         user_id:
 *           type: string
 *           description: 作者ID
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 */

// 认证相关API
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - nickname
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: 注册成功
 */
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(30).required(),
  nickname: Joi.string().min(2).max(20).required(),
});

// 添加认证API路由，确保路径和前端匹配
router.post(
  "/api/auth/login",
  Validator.validateBody(loginSchema),
  userController.login,
);
router.post(
  "/api/auth/register",
  Validator.validateBody(registerSchema),
  userController.register,
);

// API路由
router.use("/api/users", userRoutes);
router.use("/api/posts", postRoutes);
router.use("/api/comments", commentRoutes);
router.use("/api/likes", likeRoutes);
router.use("/api/favorites", favoriteRoutes);
router.use("/api/follows", followRoutes);
router.use("/api/messages", messageRoutes);
router.use("/api/private-messages", privateMessageRoutes);
router.use("/api/topics", topicRoutes);
router.use("/api/categories", categoryRoutes);
router.use("/api/upload", uploadRoutes);
router.use("/api/search", searchRoutes);
router.use("/api/settings", settingsRoutes);
router.use("/api/events", eventRoutes);
router.use("/api/registrations", eventRegistrationRoutes);
router.use("/api/banners", bannerRoutes);
router.use("/api/badges", badgeRoutes);
router.use("/api/tags", tagRoutes);
router.use("/api/emojis", emojiRoutes);

// 管理员API路由
router.use("/api/admin", adminRoutes);

// 内容管理路由（为管理后台提供）
router.get("/api/content/categories", configController.getAllCategories);

router.use("/content", categoryRoutes);

// 配置版本检查路由（无需认证，供前端App使用）
router.get("/api/config-version", configController.getConfigVersion);

// 内容验证规则路由（无需认证，供前端缓存使用）
router.get("/api/content-rules", configController.getContentRules);

// 注意：/health 和 /api/health 健康检查端点已在 app.js 中定义（位于限流之前），
// 此处不再重复注册，避免路由冲突。

// 重置强制更新标志的临时接口（需要管理员权限，仅用于调试）
router.post(
  "/api/reset-force-update",
  AdminMiddleware.authenticate(),
  configController.resetForceUpdate,
);

module.exports = router;
