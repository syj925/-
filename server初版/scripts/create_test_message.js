const { Message, User } = require('../models/associations');
const { sequelize } = require('../config/db');
const asyncHandler = require('express-async-handler');

// 创建测试消息的异步函数
const createTestMessages = async () => {
  try {
    console.log('开始创建测试消息...');
    
    // 查找用户ID为1的账号
    const user = await User.findOne({ where: { id: 1 } });
    
    if (!user) {
      console.error('找不到用户ID为1的账号，请先创建用户');
      return;
    }
    
    console.log(`找到用户: ${user.nickname || user.username}`);
    
    // 创建一个系统消息
    const systemMessage = await Message.create({
      senderId: 3,  // 假设3是系统用户ID
      recipientId: user.id,
      type: 'system',
      title: '新测试系统消息',
      content: '这是一条测试系统消息，用于测试消息中心功能',
      isRead: false,
      data: JSON.stringify({
        icon: 'notice',
        summary: '测试消息摘要'
      })
    });
    
    console.log('创建系统消息成功:', systemMessage.toJSON());
    
    // 创建一条评论消息
    const commentMessage = await Message.create({
      senderId: 2,  // 假设2是另一个用户ID
      recipientId: user.id,
      type: 'comment',
      title: '新评论通知',
      content: '有用户评论了你的帖子',
      isRead: false,
      postId: 1,  // 假设1是帖子ID
      commentId: 1, // 假设1是评论ID
      data: JSON.stringify({
        content: '这个帖子很有趣！',
        postTitle: '测试帖子标题'
      })
    });
    
    console.log('创建评论消息成功:', commentMessage.toJSON());
    
    console.log('所有测试消息创建完成');
    
  } catch (error) {
    console.error('创建测试消息时出错:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
};

// 执行测试消息创建函数
createTestMessages(); 