/**
 * Sequelize 统一实例提供者
 * 提供全局唯一的 Sequelize 实例
 * 解决多实例问题和循环依赖问题
 */

const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

// 立即创建 Sequelize 实例
console.log('正在初始化全局Sequelize实例...');
const dbConfig = config.database;
const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    logging: logger ? (msg) => logger.debug(msg) : console.log,
    timezone: '+08:00', // 设置为中国时区
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true, // 开启软删除
      freezeTableName: false // 不使用复数表名
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 尝试连接但不阻塞启动流程
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功 (统一实例)');
  })
  .catch(err => {
    console.error('数据库连接失败 (统一实例):', err);
  });

// 导出简化的接口
module.exports = {
  sequelize,
  Sequelize
}; 