/**
 * 统一初始化模型和关联关系
 * 此文件解决循环引用问题，应该在应用启动时首先引入
 */

// 导入统一的Sequelize实例
const { sequelize } = require('../config/sequelizeInstance');

// 导入模型实例 - 在实际使用前初始化各个模型
const db = require('./index');

// 测试模型导出
function testModelExports() {
  const fs = require('fs');
  const path = require('path');
  
  const modelsDir = path.join(__dirname);
  const modelFiles = fs.readdirSync(modelsDir).filter(file => {
    return file.indexOf('.') !== 0 && 
           file !== 'index.js' && 
           file !== 'init.js' && 
           file !== 'associations.js' && 
           file.slice(-3) === '.js';
  });
  
  console.log('测试模型导出...');
  modelFiles.forEach(file => {
    try {
      const modelPath = path.join(modelsDir, file);
      const modelExport = require(modelPath);
      
      if (typeof modelExport !== 'function') {
        console.error(`错误: ${file} 导出的不是函数`);
      } else {
        console.log(`成功: ${file} 导出正确`);
      }
    } catch (error) {
      console.error(`错误加载 ${file}: ${error.message}`);
    }
  });
}

// 导出所有内容，作为模块引用的统一入口点
module.exports = {
  // 导出sequelize实例
  sequelize,
  
  // 测试函数
  testModelExports,
  
  // 暴露一个初始化方法，供app.js调用
  initializeAssociations: () => {
    // 检查初始化标志
    if (db.associationsInitialized) {
      console.log('关联关系已初始化，跳过...');
      return;
    }
    
    // 检查所有必要模型是否已完全加载
    if (!db || !db.modelsLoaded) {
      console.error('模型尚未完全加载，无法初始化关联');
      return;
    }
    
    console.log('开始初始化模型关联关系...');
    try {
      // User 和 Tag 的多对多关联
      if (db.User && db.Tag) {
        db.User.belongsToMany(db.Tag, {
          through: 'user_tags',
          foreignKey: 'user_id',
          otherKey: 'tag_id',
          as: 'tags'  // 使用原始名称，已解决循环依赖问题
        });
        
        db.Tag.belongsToMany(db.User, {
          through: 'user_tags',
          foreignKey: 'tag_id',
          otherKey: 'user_id',
          as: 'users'  // 使用原始名称，已解决循环依赖问题
        });
        
        // Tag 和创建者 User 的关联
        db.Tag.belongsTo(db.User, {
          foreignKey: 'creatorId',
          as: 'creator'
        });
      }
      
      // User 和 Badge 的多对多关联
      if (db.User && db.Badge && db.UserBadge) {
        db.User.belongsToMany(db.Badge, {
          through: db.UserBadge,
          foreignKey: 'userId',
          as: 'badges'
        });
        
        db.Badge.belongsToMany(db.User, {
          through: db.UserBadge,
          foreignKey: 'badgeId',
          as: 'users'
        });
        
        // Badge 和 UserBadge 的关联
        db.Badge.hasMany(db.UserBadge, {
          foreignKey: 'badgeId',
          as: 'userBadges'
        });
        
        db.UserBadge.belongsTo(db.Badge, {
          foreignKey: 'badgeId',
          as: 'badge'
        });
        
        // User 和 UserBadge 的关联
        db.User.hasMany(db.UserBadge, {
          foreignKey: 'userId',
          as: 'userBadges'
        });
        
        db.UserBadge.belongsTo(db.User, {
          foreignKey: 'userId',
          as: 'user'
        });
      }
      
      // Post 和 User 的关联
      if (db.Post && db.User) {
        db.Post.belongsTo(db.User, {
          foreignKey: 'userId',
          as: 'author'
        });
        
        db.User.hasMany(db.Post, {
          foreignKey: 'userId',
          as: 'posts'
        });
      }
      
      // Post 和 Topic 的多对多关联
      if (db.Post && db.Topic && db.PostTopic) {
        db.Post.belongsToMany(db.Topic, {
          through: db.PostTopic,
          foreignKey: 'post_id',
          otherKey: 'topic_id',
          as: 'topicList'
        });
        
        db.Topic.belongsToMany(db.Post, {
          through: db.PostTopic,
          foreignKey: 'topic_id',
          otherKey: 'post_id',
          as: 'posts'
        });
      }
      
      // Comment 和 User, Post 的关联
      if (db.Comment && db.User && db.Post) {
        db.Comment.belongsTo(db.User, {
          foreignKey: 'userId',
          as: 'author'
        });
        
        db.User.hasMany(db.Comment, {
          foreignKey: 'userId',
          as: 'comments'
        });
        
        db.Comment.belongsTo(db.Post, {
          foreignKey: 'postId',
          as: 'post'
        });
        
        db.Post.hasMany(db.Comment, {
          foreignKey: 'postId',
          as: 'postComments'
        });
      }
      
      // User 和 Follow 的关联
      if (db.User && db.Follow) {
        db.User.hasMany(db.Follow, {
          foreignKey: 'followerId', 
          as: 'following'
        });
        
        db.User.hasMany(db.Follow, {
          foreignKey: 'followingId',
          as: 'followers'
        });
        
        db.Follow.belongsTo(db.User, {
          foreignKey: 'followerId',
          as: 'follower'
        });
        
        db.Follow.belongsTo(db.User, {
          foreignKey: 'followingId',
          as: 'followedUser'
        });
      }
      
      // User, Post 和 Collection 的关联
      if (db.User && db.Post && db.Collection) {
        db.User.hasMany(db.Collection, {
          foreignKey: 'userId',
          as: 'collections'
        });
        
        db.Post.hasMany(db.Collection, {
          foreignKey: 'postId',
          as: 'collectedBy'
        });
        
        db.Collection.belongsTo(db.User, {
          foreignKey: 'userId',
          as: 'user'
        });
        
        db.Collection.belongsTo(db.Post, {
          foreignKey: 'postId',
          as: 'post'
        });
      }
      
      // Message 相关关联
      if (db.Message && db.User && db.Post && db.Comment) {
        db.Message.belongsTo(db.User, {
          foreignKey: 'senderId',
          as: 'sender'
        });
        
        db.Message.belongsTo(db.User, {
          foreignKey: 'recipientId',
          as: 'recipient'
        });
        
        db.User.hasMany(db.Message, {
          foreignKey: 'senderId',
          as: 'sentMessages'
        });
        
        db.User.hasMany(db.Message, {
          foreignKey: 'recipientId',
          as: 'receivedMessages'
        });
        
        db.Message.belongsTo(db.Post, {
          foreignKey: 'postId',
          as: 'post'
        });
        
        db.Message.belongsTo(db.Comment, {
          foreignKey: 'commentId',
          as: 'comment'
        });
      }
      
      // Event 相关关联
      if (db.Event && db.User && db.EventRegistration) {
        db.Event.belongsTo(db.User, {
          foreignKey: 'creatorId',
          as: 'creator'
        });
        
        db.Event.belongsToMany(db.User, {
          through: 'EventParticipants',
          foreignKey: 'eventId',
          otherKey: 'userId',
          as: 'participants'
        });
        
        db.User.belongsToMany(db.Event, {
          through: 'EventParticipants',
          foreignKey: 'userId',
          otherKey: 'eventId',
          as: 'joinedEvents'
        });
        
        db.Event.hasMany(db.EventRegistration, {
          foreignKey: 'eventId',
          as: 'registrations'
        });
        
        db.EventRegistration.belongsTo(db.Event, {
          foreignKey: 'eventId',
          as: 'event'
        });
        
        db.EventRegistration.belongsTo(db.User, {
          foreignKey: 'userId',
          as: 'user'
        });
        
        db.User.hasMany(db.EventRegistration, {
          foreignKey: 'userId',
          as: 'eventRegistrations'
        });
      }
      
      // SystemNotification 相关关联
      if (db.SystemNotification && db.User && db.NotificationRecipient) {
        db.SystemNotification.belongsTo(db.User, {
          foreignKey: 'senderId',
          as: 'sender'
        });
        
        db.SystemNotification.belongsToMany(db.User, {
          through: db.NotificationRecipient,
          foreignKey: 'notificationId',
          otherKey: 'recipientId',
          as: 'recipients'
        });
        
        db.User.belongsToMany(db.SystemNotification, {
          through: db.NotificationRecipient,
          foreignKey: 'recipientId',
          otherKey: 'notificationId',
          as: 'systemNotifications'
        });
        
        db.NotificationRecipient.belongsTo(db.SystemNotification, {
          foreignKey: 'notificationId',
          as: 'notification'
        });
        
        db.NotificationRecipient.belongsTo(db.User, {
          foreignKey: 'recipientId',
          as: 'recipient'
        });
      }
      
      // 设置标志表示已经初始化
      db.associationsInitialized = true;
      console.log('模型关联关系初始化完成！');
    } catch (error) {
      console.error('初始化关联关系时出错:', error);
    }
  },
  
  // 为了兼容性，导出所有模型
  User: db.User,
  Post: db.Post,
  Like: db.Like,
  Comment: db.Comment,
  Follow: db.Follow,
  Tag: db.Tag,
  Topic: db.Topic,
  PostTopic: db.PostTopic,
  Message: db.Message,
  Event: db.Event,
  EventRegistration: db.EventRegistration,
  Relationship: db.Relationship,
  Collection: db.Collection,
  PostView: db.PostView,
  Badge: db.Badge,
  UserBadge: db.UserBadge,
  Setting: db.Setting,
  Log: db.Log,
  Notification: db.Notification,
  Reply: db.Reply,
  Banner: db.Banner,
  Category: db.Category,
  SystemNotification: db.SystemNotification,
  NotificationRecipient: db.NotificationRecipient
}; 