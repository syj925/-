const { v4: uuidv4 } = require('uuid');

/**
 * 表情使用历史模型
 */
module.exports = (sequelize, DataTypes) => {
  const EmojiUsageHistory = sequelize.define('EmojiUsageHistory', {
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
      },
      comment: '用户ID'
    },
    emoji_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'emojis',
        key: 'id'
      },
      comment: '表情ID'
    },
    usage_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '使用次数'
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '最后使用时间'
    }
  }, {
    tableName: 'emoji_usage_history',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'emoji_id'] },
      { fields: ['user_id', 'last_used_at'] }
    ]
  });

  EmojiUsageHistory.associate = (models) => {
    EmojiUsageHistory.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    EmojiUsageHistory.belongsTo(models.Emoji, {
      foreignKey: 'emoji_id',
      as: 'emoji'
    });
  };

  return EmojiUsageHistory;
};
