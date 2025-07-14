/**
 * 通知接收者模型
 * 用于存储系统通知的接收者关联表
 */
module.exports = (sequelize, DataTypes) => {
  const NotificationRecipient = sequelize.define('NotificationRecipient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '系统通知ID'
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '接收者用户ID'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否已读'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '阅读时间'
    },
    status: {
      type: DataTypes.ENUM('delivered', 'read', 'archived'),
      allowNull: false,
      defaultValue: 'delivered',
      comment: '状态：已投递/已读/已归档'
    }
  }, {
    tableName: 'notification_recipients',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  // 关联关系已移至统一管理文件
  NotificationRecipient.associate = function(models) {
    console.log('NotificationRecipient关联关系已移至models/associations.js');
    // 关联逻辑移至associations.js
    /*
    NotificationRecipient.belongsTo(models.SystemNotification, {
      foreignKey: 'notificationId',
      as: 'notification'
    });
    
    NotificationRecipient.belongsTo(models.User, {
      foreignKey: 'recipientId',
      as: 'recipient'
    });
    */
  };

  return NotificationRecipient;
}; 