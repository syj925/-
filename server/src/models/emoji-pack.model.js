const { v4: uuidv4 } = require('uuid');

/**
 * 表情包模型
 */
module.exports = (sequelize, DataTypes) => {
  const EmojiPack = sequelize.define('EmojiPack', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    cover_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图URL'
    },
    type: {
      type: DataTypes.ENUM('system', 'official', 'user', 'store'),
      allowNull: false,
      defaultValue: 'official',
      comment: 'system:系统内置 official:官方 user:用户创建 store:商店'
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '创建者ID'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '价格（0为免费）'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否精选推荐'
    },
    download_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '下载次数'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'rejected'),
      allowNull: false,
      defaultValue: 'active'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '版本号'
    }
  }, {
    tableName: 'emoji_packs',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['type', 'status'] },
      { fields: ['author_id'] },
      { fields: ['is_featured', 'sort_order'] },
      { fields: ['status', 'sort_order'] }
    ]
  });

  EmojiPack.associate = (models) => {
    // 表情包包含多个表情
    EmojiPack.hasMany(models.Emoji, {
      foreignKey: 'pack_id',
      as: 'emojis'
    });
    
    // 表情包作者
    EmojiPack.belongsTo(models.User, {
      foreignKey: 'author_id',
      as: 'author'
    });
    
    // 用户拥有的表情包（多对多）
    EmojiPack.belongsToMany(models.User, {
      through: models.UserEmojiPack,
      foreignKey: 'pack_id',
      otherKey: 'user_id',
      as: 'users'
    });
  };

  return EmojiPack;
};
