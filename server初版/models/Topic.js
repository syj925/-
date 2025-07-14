/**
 * 话题模型
 * 用于存储社区话题信息
 */
const { DataTypes } = require('sequelize');

/**
 * 确保views列存在
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 */
const ensureViewsColumn = async (sequelize) => {
  try {
    // 检查views列是否存在
    const [results] = await sequelize.query(
      `SHOW COLUMNS FROM topics LIKE 'views'`
    );
    
    if (results.length === 0) {
      console.log('尝试添加views列到topics表...');
      // 如果不存在，添加列
      await sequelize.query(
        `ALTER TABLE topics ADD COLUMN views INT DEFAULT 0 COMMENT '话题浏览量' AFTER usage_count`
      );
      console.log('成功添加views列到topics表');
    } else {
      console.log('views列已存在于topics表');
    }
  } catch (error) {
    console.error('检查/添加views列时出错:', error);
  }
};

module.exports = (sequelize, DataTypes) => {
  /**
   * 定义Topic模型
   */
  const Topic = sequelize.define('Topic', {
    // 话题ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 话题名称
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // 话题描述
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 封面图片
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'cover_image'
    },
    // 待审核的封面图片
    pendingImage: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pending_image'
    },
    // 图片状态: default(默认图片), pending(待审核), approved(已通过), rejected(已拒绝)
    imageStatus: {
      type: DataTypes.ENUM('default', 'pending', 'approved', 'rejected'),
      defaultValue: 'default',
      field: 'image_status'
    },
    // 使用次数
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'usage_count'
    },
    // 浏览次数 - 新增字段
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '话题浏览量'
    },
    // 状态
    status: {
      type: DataTypes.ENUM('active', 'hidden', 'deleted'),
      defaultValue: 'active'
    },
    // SEO相关字段
    metaTitle: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'meta_title'
    },
    metaDescription: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'meta_description'
    },
    metaKeywords: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'meta_keywords'
    },
    // 内容审核配置
    sensitiveWordsLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
      field: 'sensitive_words_level'
    },
    autoReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'auto_review'
    },
    customSensitiveWords: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '自定义敏感词，逗号分隔',
      field: 'custom_sensitive_words'
    },
    bannedWords: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '禁止发布的词语，逗号分隔',
      field: 'banned_words'
    },
    // 创建人ID
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'creator_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // 分类ID
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    // 模型选项
    sequelize,
    modelName: 'Topic',
    tableName: 'topics',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: 'topics_name_index',
        fields: ['name']
      },
      {
        name: 'topics_status_index',
        fields: ['status']
      },
      {
        name: 'topics_creator_id_index',
        fields: ['creator_id']
      },
      {
        name: 'topics_category_id_index',
        fields: ['category_id']
      }
    ],
    hooks: {
      afterSync: async () => {
        // 在模型同步后确保列存在
        await ensureViewsColumn(sequelize);
      }
    }
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  Topic.associate = (models) => {
    // 话题与帖子的多对多关系
    if (models.Post) {
      Topic.belongsToMany(models.Post, {
        through: 'post_topics',
        foreignKey: 'topic_id',
        otherKey: 'post_id',
        as: 'posts'
      });
    }

    // 话题与创建者的关系
    if (models.User) {
      Topic.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator'
      });
    }

    // 话题与分类的关系
    if (models.Category) {
      Topic.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
      });
    }
  };

  return Topic;
}; 