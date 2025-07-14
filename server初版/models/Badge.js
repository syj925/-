const { DataTypes } = require('sequelize');

/**
 * 用户徽章模型
 * @description 存储系统中的所有徽章定义，如"校园达人"等
 */
module.exports = (sequelize, DataTypes) => {
  const Badge = sequelize.define('Badge', {
    // 徽章ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // 徽章名称
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    // 徽章描述
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 徽章颜色 (十六进制颜色代码)
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#4A90E2'
    },
    // 徽章状态 (1=启用，0=禁用)
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'badges',
    timestamps: true, // 创建和更新时间戳
    paranoid: true,   // 软删除
    underscored: true, // 使用下划线命名格式映射到数据库列名
    indexes: [
      {
        name: 'badges_name_index',
        fields: ['name']
      },
      {
        name: 'badges_status_index',
        fields: ['status']
      }
    ]
  });

  // 定义关联关系
  Badge.associate = (models) => {
    // Badge与User之间多对多关系
    Badge.belongsToMany(models.User, {
      through: models.UserBadge,
      foreignKey: 'badgeId',
      as: 'users'
    });

    // Badge与UserBadge之间一对多关系
    Badge.hasMany(models.UserBadge, {
      foreignKey: 'badgeId',
      as: 'userBadges'
    });
  };

  return Badge;
}; 