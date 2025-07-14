const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * User模型定义
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 * @returns {import('sequelize').Model} - User模型
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // 用户ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 用户昵称
    nickname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 登录账号
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      // 临时移除unique: true约束，避免Too many keys错误
      // unique: true
    },
    // 密码
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        // 密码加密
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(value, salt);
        this.setDataValue('password', hash);
      }
    },
    // 头像
    avatar: {
      type: DataTypes.STRING,
      defaultValue: '/uploads/default-avatar.png'
    },
    // 个人简介
    bio: {
      type: DataTypes.TEXT
    },
    // 电子邮箱
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    // 角色（用户、管理员）
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    // 状态
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      defaultValue: 'active'
    },
    // 用户设置 - JSON格式存储各种设置
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        privacy: {
          anonymousMode: false,
          allowSearch: true,
          showLocation: false
        }
      },
      get() {
        const rawValue = this.getDataValue('settings');
        // 确保返回对象，如果数据库值为null
        return rawValue || {
          privacy: {
            anonymousMode: false,
            allowSearch: true,
            showLocation: false
          }
        };
      }
    }
  }, {
    tableName: 'users',
    // 模型选项
    timestamps: true, // 自动添加createdAt和updatedAt字段
    paranoid: true,   // 软删除，当删除时设置deletedAt而不是真正删除
    underscored: true, // 将驼峰命名转换为下划线
    // 实例方法
    hooks: {
      // 创建前处理
      beforeCreate: async (user) => {
        // 如果没有设置昵称，使用用户名作为昵称
        if (!user.nickname) {
          user.nickname = user.username;
        }
      }
    },
    scopes: {
      // 不包含密码的用户信息
      withoutPassword: {
        attributes: { exclude: ['password'] }
      }
    }
  });

  // 实例方法 - 校验密码
  User.prototype.checkPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  /**
   * 模型关联关系
   * @param {Object} models - 所有模型
   */
  User.associate = function(models) {
    // 用户与帖子的关系
    if (models.Post) {
      User.hasMany(models.Post, {
        foreignKey: 'user_id',
        as: 'posts'
      });
    }

    // 用户与评论的关系
    if (models.Comment) {
      User.hasMany(models.Comment, {
        foreignKey: 'user_id',
        as: 'comments'
      });
    }

    // 用户与点赞的关系
    if (models.Like) {
      User.hasMany(models.Like, {
        foreignKey: 'user_id',
        as: 'likes'
      });
    }

    // 用户与收藏的关系
    if (models.Collection) {
      User.hasMany(models.Collection, {
        foreignKey: 'user_id',
        as: 'collections'
      });
    }

    // 用户与关注的关系（作为关注者）
    if (models.Follow) {
      User.hasMany(models.Follow, {
        foreignKey: 'follower_id',
        as: 'following'
      });
    }

    // 用户与被关注的关系（作为被关注者）
    if (models.Follow) {
      User.hasMany(models.Follow, {
        foreignKey: 'following_id',
        as: 'followers'
      });
    }

    // 用户与标签的多对多关系（用户兴趣标签）
    if (models.Tag) {
      User.belongsToMany(models.Tag, {
        through: 'user_tags',
        foreignKey: 'user_id',
        otherKey: 'tag_id',
        as: 'tags'
      });
    }

    // 用户与徽章(Badge)的多对多关系
    if (models.Badge) {
      User.belongsToMany(models.Badge, {
        through: models.UserBadge,
        foreignKey: 'userId',
        otherKey: 'badgeId',
        as: 'badges'
      });

      // 用户与UserBadge的一对多关系
      User.hasMany(models.UserBadge, {
        foreignKey: 'userId',
        as: 'userBadges'
      });
    }
  };

  return User;
}; 