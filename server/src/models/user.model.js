const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          notEmpty: true
        }
      },
      nickname: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        validate: {
          len: [2, 50]
        }
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
        validate: {
          is: /^1[3-9]\d{9}$/
        }
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      background_image: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('student', 'teacher', 'admin'),
        allowNull: false,
        defaultValue: 'student'
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      school: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      is_disabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'banned'),
        allowNull: false,
        defaultValue: 'active'
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      // 用户设置 - JSON格式存储各种设置
      settings: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          privacy: {
            anonymousMode: false,
            allowSearch: true,
            showLocation: false,
            allowFollow: true,
            allowComment: true,
            allowMessage: true,
            favoriteVisible: false,
            followListVisible: true,
            fansListVisible: true
          }
        },
        get() {
          const rawValue = this.getDataValue('settings');
          // 确保返回对象，如果数据库值为null
          return rawValue || {
            privacy: {
              anonymousMode: false,
              allowSearch: true,
              showLocation: false,
              allowFollow: true,
              allowComment: true,
              allowMessage: true,
              favoriteVisible: false,
              followListVisible: true,
              fansListVisible: true
            }
          };
        }
      }
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
      paranoid: true, // 启用软删除
      // 数据库索引优化查询性能
      indexes: [
        {
          name: 'idx_user_role',
          fields: ['role']
        },
        {
          name: 'idx_user_status',
          fields: ['status']
        },
        {
          name: 'idx_user_is_disabled',
          fields: ['is_disabled']
        },
        {
          name: 'idx_user_created_at',
          fields: ['created_at']
        },
        {
          name: 'idx_user_last_login',
          fields: ['last_login_at']
        }
      ],
      // 隐藏敏感字段
      defaultScope: {
        attributes: { exclude: ['password'] }
      },
      // 定义其他作用域
      scopes: {
        withPassword: {
          attributes: { include: ['password'] }
        },
        basic: {
          attributes: ['id', 'username', 'avatar', 'role']
        }
      }
    }
  );

  // 定义关联关系
  User.associate = models => {
    // 用户与帖子是一对多关系
    User.hasMany(models.Post, {
      foreignKey: 'user_id',
      as: 'posts'
    });

    // 用户与评论是一对多关系
    User.hasMany(models.Comment, {
      foreignKey: 'user_id',
      as: 'comments'
    });

    // 用户与点赞是一对多关系
    User.hasMany(models.Like, {
      foreignKey: 'user_id',
      as: 'likes'
    });

    // 用户与收藏是一对多关系
    User.hasMany(models.Favorite, {
      foreignKey: 'user_id',
      as: 'favorites'
    });

    // 用户与发送消息是一对多关系
    User.hasMany(models.Message, {
      foreignKey: 'sender_id',
      as: 'sentMessages'
    });

    // 用户与接收消息是一对多关系
    User.hasMany(models.Message, {
      foreignKey: 'receiver_id',
      as: 'receivedMessages'
    });

    // 用户与关注关系的关联
    // 用户作为关注者的关注关系
    User.hasMany(models.Follow, {
      foreignKey: 'follower_id',
      as: 'followings'
    });

    // 用户作为被关注者的关注关系
    User.hasMany(models.Follow, {
      foreignKey: 'following_id',
      as: 'followers'
    });

    // 用户通过关注关系关联到其他用户（关注的用户）
    User.belongsToMany(models.User, {
      through: models.Follow,
      foreignKey: 'follower_id',
      otherKey: 'following_id',
      as: 'followingUsers'
    });

    // 用户通过关注关系关联到其他用户（粉丝用户）
    User.belongsToMany(models.User, {
      through: models.Follow,
      foreignKey: 'following_id',
      otherKey: 'follower_id',
      as: 'followerUsers'
    });

    // 用户与徽章多对多关联
    User.belongsToMany(models.Badge, {
      through: models.UserBadge,
      foreignKey: 'user_id',
      otherKey: 'badge_id',
      as: 'badges'
    });

    // 用户与用户徽章关联
    User.hasMany(models.UserBadge, {
      foreignKey: 'user_id',
      as: 'userBadges'
    });

    // 用户作为授予者的徽章关联
    User.hasMany(models.UserBadge, {
      foreignKey: 'granted_by',
      as: 'grantedBadges'
    });

    // 用户与标签多对多关联
    if (models.Tag && models.UserTag) {
      User.belongsToMany(models.Tag, {
        through: models.UserTag,
        foreignKey: 'user_id',
        otherKey: 'tag_id',
        as: 'tags'
      });

      // 用户与用户标签关联
      User.hasMany(models.UserTag, {
        foreignKey: 'user_id',
        as: 'userTags'
      });
    }
  };

  return User;
}; 