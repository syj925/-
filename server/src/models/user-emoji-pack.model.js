const { v4: uuidv4 } = require('uuid');

/**
 * 用户表情包关联模型
 */
module.exports = (sequelize, DataTypes) => {
  const UserEmojiPack = sequelize.define('UserEmojiPack', {
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
    pack_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'emoji_packs',
        key: 'id'
      },
      comment: '表情包ID'
    },
    source: {
      type: DataTypes.ENUM('default', 'download', 'purchase', 'gift'),
      allowNull: false,
      defaultValue: 'download',
      comment: 'default:默认 download:下载 purchase:购买 gift:赠送'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '用户自定义排序'
    }
  }, {
    tableName: 'user_emoji_packs',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'pack_id'] },
      { fields: ['user_id', 'sort_order'] }
    ]
  });

  UserEmojiPack.associate = (models) => {
    UserEmojiPack.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    UserEmojiPack.belongsTo(models.EmojiPack, {
      foreignKey: 'pack_id',
      as: 'pack'
    });
  };

  return UserEmojiPack;
};
