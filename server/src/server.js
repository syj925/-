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
      logger.info(`网络访问: http://192.168.1.11:${config.port}/health`);
    });

    // 初始化WebSocket服务
    WebSocketService.initialize(server);
    logger.info('WebSocket服务已启动');

    // 处理信号
    const gracefulShutdown = () => {
      logger.info('收到关闭信号，正在关闭服务器...');
      server.close(() => {
        logger.info('HTTP服务器已关闭');
        process.exit(0);
      });
      
      // 如果15秒内未关闭，强制退出
      setTimeout(() => {
        logger.error('无法在规定时间内关闭连接，强制关闭');
        process.exit(1);
      }, 15000);
    };

    // 监听终止信号
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    return server;
  } catch (error) {
    logger.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
const server = startServer();

module.exports = server; 