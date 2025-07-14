/**
 * 检查数据库表结构
 */
const { Sequelize } = require('sequelize');
const config = require('./config/sequelize');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database, 
  dbConfig.username, 
  dbConfig.password, 
  dbConfig
);

async function checkDatabaseTables() {
  try {
    // 检查连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取所有表
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('\n数据库中的表:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });

    // 检查系统通知表结构
    console.log('\n系统通知表(system_notifications)结构:');
    const [systemNotificationsColumns] = await sequelize.query('DESCRIBE system_notifications');
    console.log('字段\t\t类型\t\t可为空\t默认值');
    console.log('-----------------------------------------------------');
    systemNotificationsColumns.forEach(column => {
      console.log(`${column.Field}\t\t${column.Type}\t\t${column.Null}\t${column.Default || 'NULL'}`);
    });

    // 检查通知接收者表结构
    console.log('\n通知接收者表(notification_recipients)结构:');
    const [recipientsColumns] = await sequelize.query('DESCRIBE notification_recipients');
    console.log('字段\t\t类型\t\t可为空\t默认值');
    console.log('-----------------------------------------------------');
    recipientsColumns.forEach(column => {
      console.log(`${column.Field}\t\t${column.Type}\t\t${column.Null}\t${column.Default || 'NULL'}`);
    });

    // 检查是否存在importance字段
    const hasImportance = systemNotificationsColumns.some(col => col.Field === 'importance');
    console.log(`\nImportance字段检查: ${hasImportance ? '已存在✅' : '不存在❌'}`);

    // 断开连接
    await sequelize.close();
    console.log('\n数据库连接已关闭');
  } catch (error) {
    console.error('数据库检查出错:', error);
  }
}

// 执行检查
checkDatabaseTables(); 