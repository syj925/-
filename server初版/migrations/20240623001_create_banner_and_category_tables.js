'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 创建轮播图表
    await queryInterface.createTable('banners', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '轮播图标题'
      },
      image: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '轮播图图片地址'
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '点击跳转链接'
      },
      type: {
        type: Sequelize.ENUM('url', 'post', 'topic', 'event'),
        defaultValue: 'url',
        comment: '链接类型: url-外部链接, post-帖子, topic-话题, event-活动'
      },
      target_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '目标ID，如帖子ID、话题ID等'
      },
      platform: {
        type: Sequelize.ENUM('app', 'web', 'admin', 'all'),
        defaultValue: 'all',
        comment: '展示平台: app-移动端, web-网页端, admin-后台, all-所有'
      },
      sort: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '排序，数字越小越靠前'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '状态: active-启用, inactive-禁用'
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '开始展示时间，为空表示立即展示'
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '结束展示时间，为空表示永久展示'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 创建分类表
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '分类名称'
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '分类描述'
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '分类图标'
      },
      bg_color: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '背景颜色，例如 rgba(74, 144, 226, 0.1)'
      },
      type: {
        type: Sequelize.ENUM('post', 'topic', 'event'),
        defaultValue: 'post',
        comment: '分类类型: post-帖子分类, topic-话题分类, event-活动分类'
      },
      sort: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '排序，数字越小越靠前'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '状态: active-启用, inactive-禁用'
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '父分类ID，为空表示一级分类'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 添加一些默认数据
    await queryInterface.bulkInsert('banners', [
      {
        title: '校园图书馆新书推荐',
        image: '/static/images/banner-library.jpg',
        url: '',
        type: 'url',
        platform: 'all',
        sort: 1,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: '校园学习环境展示',
        image: '/static/images/banner-campus.jpg',
        url: '',
        type: 'url',
        platform: 'all',
        sort: 2,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: '校园活动中心',
        image: '/static/images/banner-activity.jpg',
        url: '',
        type: 'url',
        platform: 'all',
        sort: 3,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // 删除轮播图表和分类表
    await queryInterface.dropTable('banners');
    await queryInterface.dropTable('categories');
  }
}; 