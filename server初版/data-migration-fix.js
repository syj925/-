/**
 * 系统通知数据迁移脚本（简化版）
 * 将现有系统通知从messages表迁移到system_notifications和notification_recipients表
 */

const { Sequelize, DataTypes, Op } = require('sequelize');
const dbConfig = require('./config/config').database;

// 创建Sequelize实例，明确指定方言
const sequelize = new Sequelize(dbConfig.name, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'mysql', // 明确指定方言
  timezone: '+08:00',
  logging: console.log
});

async function migrateSystemNotifications() {
  console.log('开始迁移系统通知数据...');
  
  try {
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 1. 查询所有系统通知消息
      console.log('正在查询现有系统通知消息...');
      const [systemMessages] = await sequelize.query(
        `SELECT m.*, 
          s.id as sender_id, s.username as sender_username, s.nickname as sender_nickname,
          r.id as recipient_id, r.username as recipient_username
         FROM messages m
         LEFT JOIN users s ON m.sender_id = s.id
         LEFT JOIN users r ON m.recipient_id = r.id
         WHERE m.type = 'system' AND m.deleted_at IS NULL`,
        { transaction }
      );
      
      console.log(`找到 ${systemMessages.length} 条系统通知消息`);
      
      if (systemMessages.length === 0) {
        console.log('没有系统通知需要迁移');
        await transaction.commit();
        return;
      }
      
      // 2. 按标题和内容分组，找出相同内容的通知
      console.log('正在按内容分组系统通知...');
      const messageGroups = {};
      
      systemMessages.forEach(message => {
        // 使用标题+内容作为唯一键
        const key = `${message.title}|${message.content}`;
        
        if (!messageGroups[key]) {
          messageGroups[key] = [];
        }
        
        messageGroups[key].push(message);
      });
      
      console.log(`分组后有 ${Object.keys(messageGroups).length} 组不同的系统通知`);
      
      // 3. 为每组创建一条新的系统通知记录，并关联接收者
      console.log('正在迁移通知数据...');
      let migratedCount = 0;
      
      for (const [key, messages] of Object.entries(messageGroups)) {
        if (messages.length === 0) continue;
        
        // 使用第一条消息作为参考
        const referenceMessage = messages[0];
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        // 获取已读消息数量
        const readCount = messages.filter(m => m.is_read === 1).length;
        const totalCount = messages.length;
        
        // 创建系统通知 - 使用手动构建的SQL
        const title = referenceMessage.title || 'System Notification';
        const content = referenceMessage.content;
        const senderId = referenceMessage.sender_id;
        
        const [result] = await sequelize.query(
          `INSERT INTO system_notifications 
           (title, content, type, sender_id, target_group, sent, read_count, total_count, created_at, updated_at) 
           VALUES 
           ('${title.replace(/'/g, "''")}', '${content.replace(/'/g, "''")}', 'announcement', ${senderId}, 'all', 1, ${readCount}, ${totalCount}, '${now}', '${now}')`,
          { transaction }
        );
        
        // 获取刚插入的通知ID
        const notificationId = result;
        
        console.log(`为通知 ID ${notificationId} 创建 ${messages.length} 条接收者记录`);
        
        // 为每个接收者创建关联记录
        for (const message of messages) {
          const isRead = message.is_read === 1 ? 1 : 0;
          const readAt = isRead ? `'${now}'` : 'NULL';
          const recipientId = message.recipient_id;
          
          await sequelize.query(
            `INSERT INTO notification_recipients 
             (notification_id, recipient_id, is_read, read_at, created_at, updated_at) 
             VALUES 
             (${notificationId}, ${recipientId}, ${isRead}, ${readAt}, '${now}', '${now}')`,
            { transaction }
          );
        }
        
        migratedCount++;
        console.log(`已迁移 ${migratedCount}/${Object.keys(messageGroups).length} 组通知`);
      }
      
      // 4. 提交事务
      await transaction.commit();
      console.log(`数据迁移完成！成功迁移 ${migratedCount} 组系统通知`);
      
      // 5. 输出迁移结果统计
      const [notificationCountResult] = await sequelize.query('SELECT COUNT(*) as count FROM system_notifications');
      const [recipientCountResult] = await sequelize.query('SELECT COUNT(*) as count FROM notification_recipients');
      
      const notificationCount = notificationCountResult[0].count;
      const recipientCount = recipientCountResult[0].count;
      
      console.log('迁移后数据统计:');
      console.log(`- 系统通知数量: ${notificationCount}`);
      console.log(`- 通知接收者记录: ${recipientCount}`);
      console.log('原系统通知数据已迁移至新表，但原始数据仍保留在messages表中');
      console.log('如需删除原始数据，请执行以下SQL: DELETE FROM messages WHERE type = "system"');
      
    } catch (error) {
      // 发生错误时回滚事务
      await transaction.rollback();
      console.error('数据迁移失败，事务已回滚:', error);
      throw error;
    }
  } catch (error) {
    console.error('数据迁移脚本执行失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行迁移
migrateSystemNotifications(); 