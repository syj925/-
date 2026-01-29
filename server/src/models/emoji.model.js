const { v4: uuidv4 } = require('uuid');

/**
 * 表情模型
 */
module.exports = (sequelize, DataTypes) => {
  const Emoji = sequelize.define('Emoji', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false
    },
    pack_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'emoji_packs',
        key: 'id'
      },
      comment: '所属表情包ID'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        is: /^\[[\w\u4e00-\u9fa5_]+\]$/  // 格式：[表情名] 支持中英文和下划线
      },
      comment: '表情代码，如 [doge]'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '表情名称'
    },
    keywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '搜索关键字，逗号分隔'
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '图片URL（相对路径）'
    },
    thumbnail_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '缩略图URL'
    },
    type: {
      type: DataTypes.ENUM('static', 'animated'),
      allowNull: false,
      defaultValue: 'static',
      comment: 'static:静态 animated:GIF动图'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: '图片宽度'
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: '图片高度'
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '文件大小(bytes)'
    },
    use_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '使用次数'
    },
    status: {
      type: DataTypes.ENUM('active', 'pending', 'rejected'),
      allowNull: false,
      defaultValue: 'active'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '在包内的排序'
    }
  }, {
    tableName: 'emojis',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['pack_id', 'status', 'sort_order'] },
      { fields: ['status'] },
      { fields: ['use_count'] },
      { fields: ['name'] }
    ]
  });

  Emoji.associate = (models) => {
    // 属于某个表情包
    Emoji.belongsTo(models.EmojiPack, {
      foreignKey: 'pack_id',
      as: 'pack'
    });
    
    // 收藏关系（多对多）
    Emoji.belongsToMany(models.User, {
      through: models.EmojiFavorite,
      foreignKey: 'emoji_id',
      otherKey: 'user_id',
      as: 'favoritedBy'
    });
    
    // 使用历史
    Emoji.hasMany(models.EmojiUsageHistory, {
      foreignKey: 'emoji_id',
      as: 'usageHistory'
    });
  };

  return Emoji;
};
