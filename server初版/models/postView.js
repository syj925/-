const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * 帖子浏览记录模型
   */
  const PostView = sequelize.define('PostView', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '可以为空表示未登录用户'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    }
  }, {
    tableName: 'post_views',
    modelName: 'PostView',
    timestamps: true,
    paranoid: true, // 软删除
    underscored: true, // 使用下划线命名
    indexes: [
      {
        fields: ['post_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  PostView.associate = (models) => {
    // 一个浏览记录属于一个用户
    PostView.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    
    // 一个浏览记录属于一个帖子
    PostView.belongsTo(models.Post, {
      foreignKey: 'postId'
    });
  };

  return PostView;
}; 