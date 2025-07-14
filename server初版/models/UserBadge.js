const { DataTypes } = require('sequelize');

/**
 * 用户-标签关联模型
 * @description 定义用户与标签之间的多对多关系
 */
module.exports = (sequelize, DataTypes) => {
  const UserBadge = sequelize.define('UserBadge', {
    // 关联ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // 用户ID (外键)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // 标签ID (外键)
    badgeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'badge_id',
      references: {
        model: 'badges',
        key: 'id'
      }
    },
    // 授予时间
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'granted_at'
    },
    // 授予者ID (可选，记录是哪个管理员授予的)
    grantedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'granted_by'
    }
  }, {
    tableName: 'user_badges',
    timestamps: true, // 创建和更新时间戳
    paranoid: true,   // 软删除，添加这个选项
    indexes: [
      {
        name: 'user_badges_user_id_badge_id_index',
        unique: true,
        fields: ['user_id', 'badge_id'] // 确保一个用户不会获得重复的标签
      },
      {
        name: 'user_badges_user_id_index',
        fields: ['user_id']
      },
      {
        name: 'user_badges_badge_id_index',
        fields: ['badge_id']
      }
    ]
  });

  // 定义关联关系
  UserBadge.associate = (models) => {
    // UserBadge与User的关系
    UserBadge.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // UserBadge与Badge的关系
    UserBadge.belongsTo(models.Badge, {
      foreignKey: 'badgeId',
      as: 'badge'
    });
  };

  return UserBadge;
}; 