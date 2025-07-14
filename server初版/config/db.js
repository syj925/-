/**
 * 数据库配置
 * 提供Sequelize实例和数据库连接
 */
const { sequelize } = require('./sequelizeInstance');
const logger = require('../utils/logger');

// 测试数据库连接
const testConnection = async () => {
  try {
    // 直接使用导入的实例
    await sequelize.authenticate();
    logger.info('数据库连接成功');
    return true;
  } catch (err) {
    logger.error('数据库连接失败:', err);
    // 返回false表示连接失败，但允许服务器继续启动
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
}; 