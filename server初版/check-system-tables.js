/**
 * 检查系统通知相关的数据库表结构和索引
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

async function checkSystemNotificationTables() {
  try {
    console.log('连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    // 查询system_notifications表结构
    console.log('\n系统通知表(system_notifications)结构:');
    const [systemNotificationsFields] = await sequelize.query('DESCRIBE system_notifications');
    systemNotificationsFields.forEach(field => {
      console.log(`${field.Field} (${field.Type}, ${field.Null === 'YES' ? '可空' : '非空'}${field.Default ? ', 默认值: ' + field.Default : ''})`);
    });

    // 特别检查status字段
    const statusField = systemNotificationsFields.find(field => field.Field === 'status');
    if (statusField) {
      console.log('\nstatus字段已存在:', statusField);
    } else {
      console.log('\n警告: status字段不存在!');
    }

    // 特别检查importance字段
    const importanceField = systemNotificationsFields.find(field => field.Field === 'importance');
    if (importanceField) {
      console.log('\nimportance字段已存在:', importanceField);
    } else {
      console.log('\n警告: importance字段不存在!');
    }

    // 查询system_notifications表索引
    console.log('\n系统通知表索引:');
    const [systemNotificationsIndexes] = await sequelize.query('SHOW INDEX FROM system_notifications');
    systemNotificationsIndexes.forEach(index => {
      console.log(`${index.Key_name}: ${index.Column_name} (${index.Non_unique ? '非唯一' : '唯一'})`);
    });

    // 查询notification_recipients表结构
    console.log('\n通知接收者表(notification_recipients)结构:');
    const [notificationRecipientsFields] = await sequelize.query('DESCRIBE notification_recipients');
    notificationRecipientsFields.forEach(field => {
      console.log(`${field.Field} (${field.Type}, ${field.Null === 'YES' ? '可空' : '非空'}${field.Default ? ', 默认值: ' + field.Default : ''})`);
    });

    // 查询notification_recipients表索引
    console.log('\n通知接收者表索引:');
    const [notificationRecipientsIndexes] = await sequelize.query('SHOW INDEX FROM notification_recipients');
    notificationRecipientsIndexes.forEach(index => {
      console.log(`${index.Key_name}: ${index.Column_name} (${index.Non_unique ? '非唯一' : '唯一'})`);
    });

    // 检查外键关系
    console.log('\n检查表之间的外键关系:');
    const [fkRelations] = await sequelize.query(`
      SELECT 
        TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        REFERENCED_TABLE_SCHEMA = DATABASE()
        AND (TABLE_NAME = 'notification_recipients' OR REFERENCED_TABLE_NAME = 'system_notifications')
    `);
    
    if (fkRelations.length > 0) {
      fkRelations.forEach(relation => {
        console.log(`${relation.TABLE_NAME}.${relation.COLUMN_NAME} -> ${relation.REFERENCED_TABLE_NAME}.${relation.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('未发现相关外键关系');
    }

    // 查询记录数量
    const [systemNotificationsCount] = await sequelize.query('SELECT COUNT(*) as count FROM system_notifications');
    const [notificationRecipientsCount] = await sequelize.query('SELECT COUNT(*) as count FROM notification_recipients');
    
    console.log(`\n系统通知记录数: ${systemNotificationsCount[0].count}`);
    console.log(`通知接收者记录数: ${notificationRecipientsCount[0].count}`);

    console.log('\n数据库检查完成，关闭连接');
    await sequelize.close();

  } catch (error) {
    console.error('数据库检查出错:', error);
    try {
      await sequelize.close();
    } catch (e) {
      console.error('关闭数据库连接出错:', e);
    }
  }
}

checkSystemNotificationTables(); 