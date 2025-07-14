// 导入数据库连接和模型
const { sequelize } = require('./config/db');

// 检查模型和消息处理函数
async function debugModels() {
  try {
    const models = require('./models/associations');
    console.log('可用模型:', Object.keys(models));
    
    if (models.NotificationRecipient) {
      console.log('NotificationRecipient 模型存在');
      console.log('主键:', models.NotificationRecipient.primaryKeyAttribute);
      console.log('表名:', models.NotificationRecipient.tableName);
      
      // 尝试查询数据
      try {
        const recipients = await models.NotificationRecipient.findOne({
          where: { notificationId: 16, recipientId: 2 }
        });
        console.log('查询结果:', recipients ? '找到记录' : '没有找到记录');
        if (recipients) console.log('记录详情:', recipients.get({ plain: true }));
      } catch (err) {
        console.error('查询失败:', err.message);
      }
    } else {
      console.log('NotificationRecipient 模型不存在');
    }
    
    // 检查消息37
    try {
      const message = await models.Message.findByPk(37);
      console.log('消息37:', message ? message.get({plain: true}) : '未找到');
    } catch (err) {
      console.error('获取消息失败:', err.message);  
    }
    
  } catch (err) {
    console.error('调试失败:', err);
  } finally {
    await sequelize.close();
  }
}

// 运行调试函数
debugModels(); 