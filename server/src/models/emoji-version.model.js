const { v4: uuidv4 } = require('uuid');

/**
 * 表情版本记录模型
 */
module.exports = (sequelize, DataTypes) => {
  const EmojiVersion = sequelize.define('EmojiVersion', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '版本号'
    },
    change_type: {
      type: DataTypes.ENUM('add', 'update', 'delete', 'mixed'),
      allowNull: false,
      comment: '变更类型'
    },
    change_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '变更数据'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '版本描述'
    },
    published_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '发布人'
    }
  }, {
    tableName: 'emoji_versions',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['version'] },
      { fields: ['created_at'] }
    ]
  });

  EmojiVersion.associate = (models) => {
    EmojiVersion.belongsTo(models.User, {
      foreignKey: 'published_by',
      as: 'publisher'
    });
  };

  return EmojiVersion;
};
