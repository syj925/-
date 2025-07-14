const { DataTypes } = require('sequelize');

// 导出模型工厂函数
module.exports = (sequelize, DataTypes) => {
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('system', 'comment', 'like', 'mention'),
    allowNull: false,
    defaultValue: 'system'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'posts',
      key: 'id'
    }
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('data');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('data', value ? JSON.stringify(value) : null);
    }
  }
}, {
  tableName: 'messages',
  paranoid: true, // 使用软删除
  underscored: true, // 使用下划线命名法
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

  // 添加关联关系定义
  Message.associate = (models) => {
    Message.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
    
    Message.belongsTo(models.User, {
      foreignKey: 'recipientId',
      as: 'recipient'
    });
    
    Message.belongsTo(models.Post, {
      foreignKey: 'postId',
      as: 'post'
    });
    
    Message.belongsTo(models.Comment, {
      foreignKey: 'commentId',
      as: 'comment'
    });
  };

  return Message;
}; 