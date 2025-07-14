const { DataTypes } = require('sequelize');

/**
 * Banner模型定义
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 * @returns {import('sequelize').Model} - Banner模型
 */
module.exports = (sequelize, DataTypes) => {
  const Banner = sequelize.define('Banner', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '轮播图标题'
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '轮播图图片地址'
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '点击跳转链接'
    },
    type: {
      type: DataTypes.ENUM('url', 'post', 'topic', 'event'),
      defaultValue: 'url',
      comment: '链接类型: url-外部链接, post-帖子, topic-话题, event-活动'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '目标ID，如帖子ID、话题ID等',
      field: 'target_id'
    },
    platform: {
      type: DataTypes.ENUM('app', 'web', 'admin', 'all'),
      defaultValue: 'all',
      comment: '展示平台: app-移动端, web-网页端, admin-后台, all-所有'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序，数字越小越靠前'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态: active-启用, inactive-禁用'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始展示时间，为空表示立即展示',
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '结束展示时间，为空表示永久展示',
      field: 'end_time'
    },
  }, {
    tableName: 'banners',
    paranoid: true, // 软删除
    underscored: true, // 将驼峰命名转换为下划线
    timestamps: true, // 添加 createdAt 和 updatedAt
    indexes: [
      {
        name: 'idx_banner_platform_status',
        fields: ['platform', 'status']
      },
      {
        name: 'idx_banner_sort',
        fields: ['sort']
      }
    ]
  });

  /**
   * 模型关联关系
   * @param {Object} models - 所有模型
   */
  Banner.associate = function(models) {
    // 暂时没有关联关系
  };

  return Banner;
}; 