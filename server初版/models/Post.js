/**
 * 帖子模型
 * 用于存储用户发布的帖子内容
 */
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * 定义Post模型
   */
  const Post = sequelize.define('Post', {
    // 帖子ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 帖子内容
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // 图片数组，以JSON字符串形式存储
    images: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('images');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('images', JSON.stringify(value || []));
      }
    },
    // 话题标签，以JSON字符串形式存储
    topics: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('topics');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('topics', JSON.stringify(value || []));
      }
    },
    // 分类ID
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id'
    },
    // 用户ID
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // 点赞数
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 评论数
    comments: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 收藏数
    collections: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 浏览数
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '浏览量'
    },
    // 是否推荐
    isRecommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否管理员推荐',
      field: 'is_recommended'
    },
    // 编辑次数
    editCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '帖子编辑次数，用于限制编辑',
      field: 'edit_count'
    },
    // 状态
    status: {
      type: DataTypes.ENUM('published', 'draft', 'hidden', 'deleted'),
      defaultValue: 'published'
    }
  }, {
    // 模型选项
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: 'posts_user_id_index',
        fields: ['user_id']
      },
      {
        name: 'posts_category_id_index',
        fields: ['category_id']
      },
      {
        name: 'posts_status_index',
        fields: ['status']
      },
      {
        name: 'posts_is_recommended_index',
        fields: ['is_recommended']
      }
    ]
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  Post.associate = (models) => {
    // 一个帖子属于一个用户
    Post.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'author'
    });

    // 一个帖子属于一个分类
    Post.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });

    // 帖子的点赞关系
    Post.hasMany(models.Like, {
      foreignKey: 'postId',
      as: 'postLikes'
    });

    // 帖子的收藏关系
    Post.hasMany(models.Collection, {
      foreignKey: 'postId',
      as: 'postCollections'
    });
    
    // 帖子与话题的多对多关联
    if (models.Topic) {
      Post.belongsToMany(models.Topic, {
        through: 'post_topics',
        foreignKey: 'post_id',
        otherKey: 'topic_id',
        as: 'topicList'
      });
    }
  };

  return Post;
}; 