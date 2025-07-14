// 导入数据库连接
const { sequelize } = require('./config/db');

// 查询系统消息数据
async function checkMessages() {
  try {
    // 查询消息与系统通知的关联
    const [messageNotiLinks] = await sequelize.query(
      'SELECT m.id as message_id, m.type, m.recipient_id, m.is_read, ' +
      'JSON_EXTRACT(m.data, "$.notification_id") as notification_id ' +
      'FROM messages m ' +
      'WHERE m.type = "system" ' +
      'LIMIT 10'
    );
    console.log("消息与通知关联:", JSON.stringify(messageNotiLinks, null, 2));
    
    // 查询未读的系统通知接收者
    const [unreadRecipients] = await sequelize.query(
      'SELECT count(*) as unread_count, notification_id ' +
      'FROM notification_recipients ' +
      'WHERE is_read = 0 ' +
      'GROUP BY notification_id'
    );
    console.log("未读通知统计:", JSON.stringify(unreadRecipients, null, 2));
    
    // 查询系统通知表
    const [notifications] = await sequelize.query(
      'SELECT id, title, read_count, total_count ' +
      'FROM system_notifications ' +
      'WHERE deleted_at IS NULL ' +
      'ORDER BY id DESC'
    );
    console.log("系统通知数据:", JSON.stringify(notifications, null, 2));
    
    // 检查两个值是否一致
    for (const notification of notifications) {
      const unreadRecipient = unreadRecipients.find(r => r.notification_id === notification.id);
      const unreadCount = unreadRecipient ? unreadRecipient.unread_count : 0;
      const expectedReadCount = notification.total_count - unreadCount;
      
      console.log(`通知 ${notification.id} (${notification.title}): ` +
                 `读取计数=${notification.read_count}, ` +
                 `总数=${notification.total_count}, ` +
                 `未读人数=${unreadCount}, ` +
                 `预期已读人数=${expectedReadCount}, ` +
                 `是否匹配: ${notification.read_count === expectedReadCount ? '是' : '否'}`);
    }
  } catch (error) {
    console.error("查询失败:", error);
  } finally {
    // 关闭连接
    await sequelize.close();
  }
}

// 执行查询
checkMessages(); 