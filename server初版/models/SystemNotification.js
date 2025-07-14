/**
 * 系统通知模型
 * 用于存储系统级别的通知，与用户关联关系通过NotificationRecipient表管理
 */
module.exports = (sequelize, DataTypes) => {
  const SystemNotification = sequelize.define('SystemNotification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '通知标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '通知内容'
    },
    type: {
      type: DataTypes.ENUM('announcement', 'notification', 'reminder'),
      allowNull: false,
      defaultValue: 'notification',
      comment: '通知类型：公告/通知/提醒'
    },
    importance: {
      type: DataTypes.ENUM('low', 'normal', 'high'),
      allowNull: false,
      defaultValue: 'normal',
      comment: '重要性：低/中/高'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '发送者ID，为空表示系统发送'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'published',
      comment: '状态：草稿/已发布/已归档'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '计划发送时间，为空表示立即发送'
    },
    readCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '已读数量',
      field: 'read_count'
    },
    totalCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '接收者总数',
      field: 'total_count'
    },
    url: {
      type: DataTypes.VIRTUAL,
      allowNull: true,
      get() {
        return ''; // 默认返回空字符串
      }
    },
  }, {
    tableName: 'system_notifications',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // 关联关系已移至统一管理文件
  SystemNotification.associate = function(models) {
    console.log('SystemNotification关联关系已移至models/associations.js');
    // 关联逻辑移至associations.js
    /*
    SystemNotification.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    
    SystemNotification.belongsToMany(models.User, {
      through: models.NotificationRecipient,
      foreignKey: 'notificationId',
      otherKey: 'recipientId',
      as: 'recipients'
    });
    */
  };

  return SystemNotification;
}; 