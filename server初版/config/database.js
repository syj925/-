/**
 * 数据库配置
 * 提供Sequelize实例和数据库连接
 */
const { sequelize } = require('./sequelizeInstance');

// 导出sequelize实例
module.exports = { sequelize }; 