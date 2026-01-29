const { v4: uuidv4 } = require('uuid');

/**
 * 表情收藏模型
 */
module.exports = (sequelize, DataTypes) => {
  const EmojiFavorite = sequelize.define('EmojiFavorite', {
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
    }
  }, {
    tableName: 'emoji_favorites',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'emoji_id'] },
      { fields: ['user_id'] }
    ]
  });

  EmojiFavorite.associate = (models) => {
    EmojiFavorite.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    EmojiFavorite.belongsTo(models.Emoji, {
      foreignKey: 'emoji_id',
      as: 'emoji'
    });
  };

  return EmojiFavorite;
};
