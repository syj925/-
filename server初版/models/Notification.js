const { DataTypes } = require('sequelize');

/**
 * Notification模型定义 - 用户通知
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 * @returns {import('sequelize').Model} - Notification模型
 */
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '通知接收用户ID',
      field: 'user_id'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '发送者用户ID，系统通知为null',
      field: 'sender_id'
    },
    type: {
      type: DataTypes.ENUM(
        'like', 'comment', 'reply', 'follow', 
        'collect', 'mention', 'system', 'activity'
      ),
      allowNull: false,
      comment: '通知类型'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '通知内容'
    },
    targetType: {
      type: DataTypes.ENUM('post', 'comment', 'topic', 'user', 'event'),
      allowNull: true,
      comment: '目标类型',
      field: 'target_type'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '目标ID',
      field: 'target_id'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否已读',
      field: 'is_read'
    },
    status: {
      type: DataTypes.ENUM('active', 'deleted'),
      defaultValue: 'active',
      comment: '状态：active-有效，deleted-已删除'
    },
    extraData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '额外数据',
      field: 'extra_data'
    }
  }, {
    tableName: 'notifications',
    paranoid: true, // 软删除
    underscored: true, // 将驼峰命名转换为下划线
    timestamps: true, // 添加 createdAt 和 updatedAt
    indexes: [
      {
        name: 'idx_notification_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_notification_status',
        fields: ['status']
      },
      {
        name: 'idx_notification_is_read',
        fields: ['is_read']
      },
      {
        name: 'idx_notification_target',
        fields: ['target_type', 'target_id']
      }
    ]
  });

  /**
   * 模型关联关系
   * @param {Object} models - 所有模型
   */
  Notification.associate = function(models) {
    // 通知与接收用户的关系
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 通知与发送者的关系
    Notification.belongsTo(models.User, {
      foreignKey: 'sender_id',
      as: 'sender'
    });

    // 动态关联目标对象
    if (models.Post) {
      Notification.belongsTo(models.Post, {
        foreignKey: 'target_id',
        constraints: false,
        scope: {
          target_type: 'post'
        },
        as: 'post'
      });
    }

    if (models.Comment) {
      Notification.belongsTo(models.Comment, {
        foreignKey: 'target_id',
        constraints: false,
        scope: {
          target_type: 'comment'
        },
        as: 'comment'
      });
    }

    if (models.Topic) {
      Notification.belongsTo(models.Topic, {
        foreignKey: 'target_id',
        constraints: false,
        scope: {
          target_type: 'topic'
        },
        as: 'topic'
      });
    }

    if (models.Event) {
      Notification.belongsTo(models.Event, {
        foreignKey: 'target_id',
        constraints: false,
        scope: {
          target_type: 'event'
        },
        as: 'event'
      });
    }
  };

  return Notification;
}; 