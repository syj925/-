const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const UserBadge = sequelize.define('UserBadge', {
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
    badge_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'badges',
        key: 'id'
      }
    },
    granted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    granted_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '授予者ID，null表示系统自动授予'
    },
    is_visible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '用户是否选择显示此徽章'
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '用户自定义显示顺序'
    }
  }, {
    tableName: 'user_badges',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { 
        fields: ['user_id', 'badge_id'], 
        unique: true,
        name: 'unique_user_badge'
      },
      { fields: ['user_id'] },
      { fields: ['badge_id'] },
      { fields: ['granted_at'] }
    ]
  });

  UserBadge.associate = models => {
    // 关联到用户
    UserBadge.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 关联到徽章
    UserBadge.belongsTo(models.Badge, {
      foreignKey: 'badge_id',
      as: 'badge'
    });

    // 关联到授予者
    UserBadge.belongsTo(models.User, {
      foreignKey: 'granted_by',
      as: 'granter'
    });
  };

  return UserBadge;
};


