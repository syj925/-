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
        allowNull: true, // 允许为null，表示"全部"分类
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
        comment: '管理员手动推荐'
      },
      auto_recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '算法自动推荐标记'
      },
      recommend_score: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: '推荐分数(0-100)，用于排序'
      },
      score_updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '推荐分数最后更新时间'
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
        },
        // 复合索引优化 - 分类页面查询
        {
          fields: ['category_id', 'status', 'created_at']
        },
        // 复合索引优化 - 用户帖子查询
        {
          fields: ['user_id', 'status', 'created_at']
        },
        // 复合索引优化 - 首页查询
        {
          fields: ['status', 'is_top', 'created_at']
        },
        // 🆕 推荐系统优化索引
        {
          name: 'idx_posts_recommendation',
          fields: ['auto_recommended', 'recommend_score', 'created_at']
        },
        {
          name: 'idx_posts_manual_recommend', 
          fields: ['is_recommended', 'created_at']
        },
        {
          name: 'idx_posts_score_updated',
          fields: ['score_updated_at']
        },
        {
          name: 'idx_posts_recommend_status',
          fields: ['status', 'auto_recommended', 'is_recommended', 'recommend_score']
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