/**
 * 用户2关注用户1的工具脚本
 */
const { Follow, User, sequelize } = require('../models/associations');

async function createFollow() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    // 检查用户是否存在
    const follower = await User.findByPk(2);
    const following = await User.findByPk(1);

    if (!follower) {
      console.error('关注者(ID:2)不存在');
      return;
    }

    if (!following) {
      console.error('被关注者(ID:1)不存在');
      return;
    }

    console.log(`关注者: ID=${follower.id}, 用户名=${follower.username}`);
    console.log(`被关注者: ID=${following.id}, 用户名=${following.username}`);

    // 检查是否已存在关注关系
    const existingFollow = await Follow.findOne({
      where: {
        followerId: 2,
        followingId: 1
      },
      paranoid: false // 包括被软删除的记录
    });

    if (existingFollow) {
      if (existingFollow.deleted_at) {
        // 如果存在但被删除了，恢复它
        console.log('发现已删除的关注关系，准备恢复...');
        await existingFollow.restore();
        console.log('成功恢复关注关系！');
      } else {
        console.log('关注关系已存在，无需创建');
      }
    } else {
      // 创建新的关注关系
      const newFollow = await Follow.create({
        followerId: 2,
        followingId: 1,
        remark: '测试关注'
      });
      
      console.log('成功创建关注关系！');
      console.log('关注ID:', newFollow.id);
    }

    // 显示当前所有关注关系
    const allFollows = await Follow.findAll({
      attributes: ['id', 'followerId', 'followingId', 'remark', 'created_at', 'updated_at', 'deleted_at']
    });
    
    console.log('\n当前所有关注关系:');
    console.log(JSON.stringify(allFollows, null, 2));

  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    // 关闭连接
    await sequelize.close();
    console.log('\n数据库连接已关闭');
  }
}

// 运行主函数
createFollow(); 