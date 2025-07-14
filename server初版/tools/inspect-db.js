/**
 * 数据库表结构检查工具
 * 用于查看数据库表的结构
 */
const { Sequelize } = require('sequelize');
const config = require('../config/config');
const sequelizeConfig = require('../config/sequelize').development;

// 创建Sequelize实例
const sequelize = new Sequelize(
  sequelizeConfig.database,
  sequelizeConfig.username,
  sequelizeConfig.password,
  {
    host: sequelizeConfig.host,
    port: sequelizeConfig.port,
    dialect: sequelizeConfig.dialect,
    logging: console.log
  }
);

// 主函数
async function main() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    // 查询follows表结构
    const [followsColumns] = await sequelize.query('SHOW COLUMNS FROM follows');
    console.log('\n===== follows表结构 =====');
    followsColumns.forEach(column => {
      console.log(`${column.Field}: ${column.Type} ${column.Null === 'YES' ? '可空' : '非空'} ${column.Key} ${column.Default ? `默认值: ${column.Default}` : ''}`);
    });

    // 查询表中的数据示例
    const [followsData] = await sequelize.query('SELECT * FROM follows LIMIT 5');
    console.log('\n===== follows表数据示例 =====');
    console.log(JSON.stringify(followsData, null, 2));

    // 关闭连接
    await sequelize.close();
    console.log('\n数据库连接已关闭');

  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 运行主函数
main(); 