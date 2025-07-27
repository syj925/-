const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    'Post',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: true,
        validate: {
          len: [0, 200]
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.ENUM('published', 'draft', 'deleted', 'pending', 'pinned', 'rejected'),
        allowNull: false,
        defaultValue: 'published',
        comment: 'published: 已发布, draft: 草稿, deleted: 已删除, pending: 待审核, pinned: 置顶, rejected: 已拒绝'
      },
      view_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      like_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      comment_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      favorite_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_top: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      location_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否匿名发布'
      },
      is_recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否推荐'
      }
    },
    {
      tableName: 'posts',
      timestamps: true,
      underscored: true,
      paranoid: true, // 启用软删除
      indexes: [
        {
          fields: ['user_id']
        },
        {
          fields: ['category_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['is_top', 'created_at']
        }
      ]
    }
  );

  // 定义关联关系
  Post.associate = models => {
    // 帖子与用户是多对一关系
    Post.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'author'
    });

    // 帖子与分类是多对一关系
    Post.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });

    // 帖子与图片是一对多关系
    Post.hasMany(models.PostImage, {
      foreignKey: 'post_id',
      as: 'images'
    });

    // 帖子与评论是一对多关系
    Post.hasMany(models.Comment, {
      foreignKey: 'post_id',
      as: 'comments'
    });

    // 帖子与话题是多对多关系
    Post.belongsToMany(models.Topic, {
      through: 'post_topics',
      foreignKey: 'post_id',
      otherKey: 'topic_id',
      as: 'topics'
    });

    // 帖子与点赞是一对多关系
    Post.hasMany(models.Like, {
      foreignKey: 'target_id',
      scope: {
        target_type: 'post'
      },
      as: 'likes',
      constraints: false
    });

    // 帖子与收藏是一对多关系
    Post.hasMany(models.Favorite, {
      foreignKey: 'post_id',
      as: 'favorites'
    });
  };

  return Post;
}; 