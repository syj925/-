const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const UserTag = sequelize.define('UserTag', {
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
    tag_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id'
      },
      comment: '标签ID'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    }
  }, {
    tableName: 'user_tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: false, // 禁用软删除
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'tag_id'],
        name: 'user_tag_unique'
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['tag_id']
      }
    ]
  });

  // 定义关联关系
  UserTag.associate = models => {
    // 用户标签与用户的关联
    UserTag.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 用户标签与标签的关联
    UserTag.belongsTo(models.Tag, {
      foreignKey: 'tag_id',
      as: 'tag'
    });
  };

  return UserTag;
};
