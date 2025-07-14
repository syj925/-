/**
 * 检查用户关注关系的工具脚本
 */
const { Follow, User, sequelize } = require('../models/associations');
const { Op } = require('sequelize');

async function checkFollowsStatus() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    // 获取所有用户
    const users = await User.findAll({
      attributes: ['id', 'username', 'nickname'],
      order: [['id', 'ASC']]
    });

    console.log('用户列表:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}`);
    });

    // 定义要检查的用户
    const userIds = [1, 2]; // 用户1和用户2，根据需要调整

    // 检查两个用户之间的所有可能关注关系
    for (const followerId of userIds) {
      for (const followingId of userIds) {
        if (followerId !== followingId) {
          // 检查是否存在关注关系（包括已删除的）
          const follows = await Follow.findAll({
            where: {
              followerId,
              followingId
            },
            paranoid: false,
            attributes: ['id', 'followerId', 'followingId', 'created_at', 'updated_at', 'deleted_at', 'remark']
          });

          console.log(`\n用户[${followerId}] -> 用户[${followingId}] 的关注关系:`);
          
          if (follows.length === 0) {
            console.log('  未找到关注关系');
          } else {
            follows.forEach(follow => {
              const status = follow.deleted_at ? '已取消关注' : '正在关注';
              console.log(`  ID: ${follow.id}, 状态: ${status}`);
              console.log(`  创建时间: ${follow.created_at}`);
              console.log(`  更新时间: ${follow.updated_at}`);
              if (follow.deleted_at) {
                console.log(`  取消时间: ${follow.deleted_at}`);
              }
              if (follow.remark) {
                console.log(`  备注: ${follow.remark}`);
              }
            });
          }
        }
      }
    }

    // 执行直接查询获取用户1的粉丝列表
    console.log('\n用户1的粉丝列表:');
    const user1Followers = await Follow.findAll({
      where: {
        followingId: 1
      },
      paranoid: false,
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'username', 'nickname']
        }
      ],
      attributes: ['id', 'followerId', 'followingId', 'created_at', 'updated_at', 'deleted_at']
    });

    if (user1Followers.length === 0) {
      console.log('  没有粉丝');
    } else {
      user1Followers.forEach(follow => {
        const status = follow.deleted_at ? '已取消关注' : '正在关注';
        console.log(`  ID: ${follow.id}, 粉丝: ${follow.follower.username} (ID: ${follow.follower.id}), 状态: ${status}`);
      });
    }

    // 执行直接查询获取用户2的粉丝列表
    console.log('\n用户2的粉丝列表:');
    const user2Followers = await Follow.findAll({
      where: {
        followingId: 2
      },
      paranoid: false,
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'username', 'nickname']
        }
      ],
      attributes: ['id', 'followerId', 'followingId', 'created_at', 'updated_at', 'deleted_at']
    });

    if (user2Followers.length === 0) {
      console.log('  没有粉丝');
    } else {
      user2Followers.forEach(follow => {
        const status = follow.deleted_at ? '已取消关注' : '正在关注';
        console.log(`  ID: ${follow.id}, 粉丝: ${follow.follower.username} (ID: ${follow.follower.id}), 状态: ${status}`);
      });
    }

    // 检查互相关注的逻辑
    console.log('\n互相关注的检查:');
    for (const userId of userIds) {
      // 找出当前用户关注的人
      const following = await Follow.findAll({
        where: {
          followerId: userId
        },
        attributes: ['followingId'],
        raw: true
      });

      // 提取关注的用户ID
      const followingIds = following.map(f => f.followingId);
      console.log(`用户[${userId}]关注了以下用户: ${followingIds.join(', ')}`);

      // 如果没有关注任何人，则跳过
      if (followingIds.length === 0) {
        console.log(`  用户[${userId}]没有关注任何人`);
        continue;
      }

      // 查询哪些用户也关注了当前用户
      const mutualFollows = await Follow.findAll({
        where: {
          followerId: {
            [Op.in]: followingIds
          },
          followingId: userId
        },
        attributes: ['followerId'],
        raw: true
      });

      const mutualUserIds = mutualFollows.map(f => f.followerId);
      if (mutualUserIds.length === 0) {
        console.log(`  没有用户与用户[${userId}]互相关注`);
      } else {
        console.log(`  用户[${userId}]与以下用户互相关注: ${mutualUserIds.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    // 关闭连接
    await sequelize.close();
    console.log('\n数据库连接已关闭');
  }
}

// 运行检查函数
checkFollowsStatus(); 