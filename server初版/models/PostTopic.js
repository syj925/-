/**
 * 帖子-话题关联模型
 * 用于建立帖子和话题之间的多对多关系
 */
const { DataTypes } = require('sequelize');

/**
 * PostTopic工厂函数
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 * @returns {import('sequelize').Model} - PostTopic模型
 */
module.exports = (sequelize, DataTypes) => {
  const PostTopic = sequelize.define('PostTopic', {
    // 关联ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 帖子ID
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'post_id',
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    // 话题ID
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'topic_id',
      references: {
        model: 'topics',
        key: 'id'
      }
    }
  }, {
    // 模型选项
    tableName: 'post_topics',
    timestamps: true,
    underscored: true,
    indexes: [
      // 复合索引，提高查询性能并确保不重复关联
      {
        unique: true,
        fields: ['post_id', 'topic_id']
      }
    ]
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  PostTopic.associate = (models) => {
    // PostTopic模型不需要额外的关联，因为它本身就是关联表
  };

  return PostTopic;
}; 