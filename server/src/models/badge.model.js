const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Badge = sequelize.define('Badge', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '#4A90E2',
      validate: {
        is: /^#[0-9A-Fa-f]{6}$/
      }
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '徽章图标名称或路径'
    },
    type: {
      type: DataTypes.ENUM('achievement', 'interest', 'system'),
      allowNull: false,
      defaultValue: 'achievement',
      comment: 'achievement:成就徽章, interest:兴趣标签, system:系统标签'
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      allowNull: false,
      defaultValue: 'common',
      comment: '稀有度：普通、稀有、史诗、传奇'
    },
    auto_grant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否自动授予'
    },
    grant_condition: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '自动授予条件配置'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'badges',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['sort_order'] }
    ]
  });

  Badge.associate = models => {
    // 与用户多对多关联
    Badge.belongsToMany(models.User, {
      through: models.UserBadge,
      foreignKey: 'badge_id',
      otherKey: 'user_id',
      as: 'users'
    });

    // 与用户徽章关联
    Badge.hasMany(models.UserBadge, {
      foreignKey: 'badge_id',
      as: 'userBadges'
    });
  };

  return Badge;
};

