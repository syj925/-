const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const MessageRead = sequelize.define(
    'MessageRead',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      message_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'messages',
          key: 'id'
        }
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'message_reads',
      timestamps: true,
      underscored: true,
      paranoid: false, // 不启用软删除
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['message_id']
        },
        {
          unique: true,
          fields: ['user_id', 'message_id'],
          name: 'uk_message_reads_user_message'
        }
      ]
    }
  );

  // 定义关联关系
  MessageRead.associate = function(models) {
    // 属于某个用户
    MessageRead.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 属于某条消息
    MessageRead.belongsTo(models.Message, {
      foreignKey: 'message_id', 
      as: 'message'
    });
  };

  return MessageRead;
};
