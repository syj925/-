const app = require('./app');
const config = require('../config');
const logger = require('../config/logger');
const { WebSocketService } = require('./utils');
const db = require('./models');

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // 记录日志后优雅退出
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // 不退出进程，但记录日志
});

// 同步数据库模型后启动服务器
async function startServer() {
  try {
    // 仅连接数据库，不同步模型（防止Too many keys错误）
    logger.info('正在连接数据库...');
    await db.sequelize.authenticate();
    logger.info('数据库连接成功');
    
    // 启动服务器，明确指定监听在所有网络接口上
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`服务器运行在端口 ${config.port} (${config.env})`);
      logger.info(`本地访问: http://localhost:${config.port}/health`);
      logger.info(`网络访问: https://callxyq.xyz:${config.port}/health`);
    });

    // 初始化WebSocket服务
    WebSocketService.initialize(server);
    logger.info('WebSocket服务已启动');

    // 🆕 启动推荐算法自动更新服务
    const autoUpdater = require('./services/recommendation-auto-updater');
    autoUpdater.start();
    logger.info('🚀 推荐自动更新服务已启动');

    // 处理信号
    const gracefulShutdown = async () => {
      logger.info('收到关闭信号，正在关闭服务器...');
      
      // 停止自动更新服务
      autoUpdater.stop();

      // 1. 刷新Write-Back队列，确保待处理操作写入数据库
      try {
        const statusCacheService = require('./services/status-cache.service');
        await statusCacheService.flushPendingOperations();
        logger.info('Write-Back队列已刷新');
      } catch (err) {
        logger.error('刷新Write-Back队列失败:', err);
      }

      // 2. 关闭HTTP服务器（停止接收新连接）
      server.close(() => {
        logger.info('HTTP服务器已关闭');
      });

      // 3. 关闭WebSocket连接
      try {
        WebSocketService.close();
        logger.info('WebSocket服务已关闭');
      } catch (err) {
        logger.error('关闭WebSocket失败:', err);
      }

      // 4. 关闭数据库连接
      try {
        await db.sequelize.close();
        logger.info('数据库连接已关闭');
      } catch (err) {
        logger.error('关闭数据库连接失败:', err);
      }

      // 5. 关闭Redis连接
      try {
        const { redisClient } = require('./utils');
        const client = redisClient.getClient();
        if (client) {
          await client.quit();
          logger.info('Redis连接已关闭');
        }
      } catch (err) {
        logger.error('关闭Redis连接失败:', err);
      }

      logger.info('所有连接已关闭，进程退出');
      process.exit(0);
    };

    // 如果15秒内未完成优雅关闭，强制退出
    const forceShutdown = () => {
      setTimeout(() => {
        logger.error('无法在规定时间内关闭连接，强制关闭');
        process.exit(1);
      }, 15000);
    };

    // 监听终止信号
    process.on('SIGTERM', () => { forceShutdown(); gracefulShutdown(); });
    process.on('SIGINT', () => { forceShutdown(); gracefulShutdown(); });
    
    return server;
  } catch (error) {
    logger.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
const server = startServer();

module.exports = server; 