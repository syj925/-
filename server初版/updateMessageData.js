// 导入数据库连接和模型
const { sequelize } = require('./config/db');

// 更新消息的data字段
async function updateMessageData() {
  try {
    // 获取所有系统通知
    const [systemNotifications] = await sequelize.query('SELECT id FROM system_notifications WHERE deleted_at IS NULL');
    console.log(`找到 ${systemNotifications.length} 个系统通知`);
    
    // 遍历每个通知
    for (const notification of systemNotifications) {
      // 找到该通知的所有接收者
      const [recipients] = await sequelize.query(
        `SELECT nr.recipient_id FROM notification_recipients nr WHERE nr.notification_id = ${notification.id}`
      );
      console.log(`通知 ${notification.id} 有 ${recipients.length} 个接收者`);
      
      // 遍历每个接收者，更新对应的消息data字段
      for (const recipient of recipients) {
        const [result] = await sequelize.query(
          `UPDATE messages SET data = JSON_OBJECT('notification_id', ${notification.id}) 
           WHERE type = 'system' AND recipient_id = ${recipient.recipient_id} 
           AND (data IS NULL OR JSON_EXTRACT(data, '$.notification_id') IS NULL)`
        );
        console.log(`为用户 ${recipient.recipient_id} 更新了 ${result.affectedRows} 条消息`);
      }
    }
    
    console.log('消息data字段更新完成');
  } catch (err) {
    console.error('更新失败:', err);
  } finally {
    await sequelize.close();
  }
}

// 执行更新
updateMessageData(); 