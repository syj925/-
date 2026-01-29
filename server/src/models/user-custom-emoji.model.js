const { v4: uuidv4 } = require('uuid');

/**
 * 用户自定义表情模型（待审核）
 */
module.exports = (sequelize, DataTypes) => {
  const UserCustomEmoji = sequelize.define('UserCustomEmoji', {
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
      comment: '上传者ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '表情名称'
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '图片URL'
    },
    type: {
      type: DataTypes.ENUM('static', 'animated'),
      allowNull: false,
      defaultValue: 'static',
      comment: 'static:静态 animated:GIF动图'
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '文件大小(bytes)'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '图片宽度'
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '图片高度'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'pending:待审核 approved:已通过 rejected:已拒绝'
    },
    reject_reason: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '拒绝原因'
    },
    reviewer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '审核员ID'
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '审核时间'
    },
    emoji_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'emojis',
        key: 'id'
      },
      comment: '审核通过后关联的正式表情ID'
    }
  }, {
    tableName: 'user_custom_emojis',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id', 'status'] },
      { fields: ['status', 'created_at'] },
      { fields: ['reviewer_id'] }
    ]
  });

  UserCustomEmoji.associate = (models) => {
    // 上传者
    UserCustomEmoji.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'uploader'
    });
    
    // 审核员
    UserCustomEmoji.belongsTo(models.User, {
      foreignKey: 'reviewer_id',
      as: 'reviewer'
    });
    
    // 审核通过后的正式表情
    UserCustomEmoji.belongsTo(models.Emoji, {
      foreignKey: 'emoji_id',
      as: 'approvedEmoji'
    });
  };

  return UserCustomEmoji;
};
