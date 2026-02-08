const express = require('express');

const { publicRouter, protectedRouter } = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const recommendationRoutes = require('./recommendation.routes');
const commentRoutes = require('./comment.routes');
const topicRoutes = require('./topic.routes');
const categoryRoutes = require('./category.routes');
const categoryStatsRoutes = require('./category-stats.routes');
const onlineStatsRoutes = require('./online-stats.routes');
const auditRoutes = require('./audit.routes');
const badgeRoutes = require('./badge.routes');
const settingsRoutes = require('./settings.routes');
const messageRoutes = require('./message.routes');
const statusRoutes = require('./status.routes');
const eventRoutes = require('./event.routes');
const emojiRoutes = require('./emoji.routes');
const statisticsRoutes = require('./statistics.routes');
const logRoutes = require('./log.routes');
const configRoutes = require('./config.routes');

const AdminMiddleware = require('../../middlewares/admin.middleware');
const logger = require('../../../config/logger');

const router = express.Router();

router.use('/', publicRouter);

router.use(AdminMiddleware.authenticate());
router.use(AdminMiddleware.formatResponse());
router.use(AdminMiddleware.logOperation());

router.use('/', protectedRouter);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/recommendation', recommendationRoutes);
router.use('/comments', commentRoutes);
router.use('/topics', topicRoutes);
router.use('/categories', categoryRoutes);
router.use('/category-stats', categoryStatsRoutes);
router.use('/stats/online', onlineStatsRoutes);
router.use('/audit', auditRoutes);
router.use('/badges', badgeRoutes);
router.use('/settings', settingsRoutes);
router.use('/messages', messageRoutes);
router.use('/', statusRoutes);
router.use('/events', eventRoutes);
router.use('/', emojiRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/logs', logRoutes);
router.use('/', configRoutes);

router.use((error, req, res, next) => {
  logger.error('Admin route error:', {
    error: error.message,
    stack: error.stack,
    adminId: req.user?.id,
    path: req.path,
    method: req.method,
    timestamp: new Date()
  });

  const statusCode = error.statusCode || 500;
  const message = error.message || '服务器内部错误';

  res.status(statusCode).json(
    AdminMiddleware.formatAdminResponse({
      success: false,
      message
    })
  );
});

module.exports = router;
