module.exports = (sequelize, DataTypes) => {
  const Topic = sequelize.define(
    'Topic',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 50]
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '话题描述'
      },
      cover_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '话题封面图片（审核通过后显示）'
      },
      pending_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '待审核的封面图片'
      },
      image_status: {
        type: DataTypes.ENUM('default', 'pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'default',
        comment: '图片状态：default(默认), pending(待审核), approved(已通过), rejected(已拒绝)'
      },
      post_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '帖子数量'
      },
      view_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '浏览次数'
      },
      hot_score: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: '热度分数'
      },
      is_hot: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否热门话题'
      },
      status: {
        type: DataTypes.ENUM('active', 'hidden', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
        comment: '话题状态'
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'general',
        comment: '话题类型'
      },
      created_by: {
        type: DataTypes.UUID,  // 修改为UUID类型，与users.id匹配
        allowNull: true,
        comment: '创建者用户ID'
      }
    },
    {
      tableName: 'topics',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['is_hot']
        },
        {
          fields: ['status']
        },
        {
          fields: ['hot_score']
        },
        {
          fields: ['post_count']
        },
        {
          fields: ['view_count']
        }
      ]
    }
  );

  // 定义关联关系
  Topic.associate = models => {
    // 话题与帖子是多对多关系
    Topic.belongsToMany(models.Post, {
      through: 'post_topics',
      foreignKey: 'topic_id',
      otherKey: 'post_id',
      as: 'posts'
    });

    // 话题与创建者的关系
    Topic.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  return Topic;
}; 