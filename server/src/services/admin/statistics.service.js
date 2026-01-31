const { User, Post, Comment, Category, Sequelize } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../../config/logger');

class StatisticsService {
  /**
   * 获取增长统计（用户、帖子、评论）
   * @param {number} days 天数，默认7天
   */
  async getGrowthStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // 生成日期数组
    const dates = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.unshift(d.toISOString().slice(0, 10));
    }

    const dateFormat = '%Y-%m-%d'; // MySQL format

    // 查询用户增长
    const userGrowth = await User.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: startDate },
        deleted_at: null
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat)],
      raw: true
    });

    // 查询帖子增长
    const postGrowth = await Post.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: startDate },
        status: 'published',
        deleted_at: null
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), dateFormat)],
      raw: true
    });

    // 填充数据
    const fillData = (sourceData) => {
      const map = {};
      sourceData.forEach(item => map[item.date] = parseInt(item.count));
      return dates.map(date => map[date] || 0);
    };

    return {
      dates,
      users: fillData(userGrowth),
      posts: fillData(postGrowth)
    };
  }

  /**
   * 获取内容分布（帖子按分类分布）
   */
  async getContentDistribution() {
    // 分类分布
    const categoryDist = await Post.findAll({
      attributes: [
        [Sequelize.col('category.name'), 'name'],
        [Sequelize.fn('COUNT', Sequelize.col('Post.id')), 'value']
      ],
      include: [{
        model: Category,
        as: 'category',
        attributes: []
      }],
      where: {
        status: 'published',
        deleted_at: null,
        category_id: { [Op.not]: null }
      },
      group: [Sequelize.col('category.name')],
      order: [[Sequelize.fn('COUNT', Sequelize.col('Post.id')), 'DESC']],
      limit: 10,
      raw: true
    });

    return categoryDist.map(item => ({
      name: item.name || '未分类',
      value: parseInt(item.value)
    }));
  }

  /**
   * 获取活跃时段分析（基于最近30天发帖和评论时间）
   */
  async getActivityStats() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const postActivity = await Post.findAll({
      attributes: [
        [Sequelize.fn('HOUR', Sequelize.col('created_at')), 'hour'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: startDate },
        deleted_at: null
      },
      group: [Sequelize.fn('HOUR', Sequelize.col('created_at'))],
      raw: true
    });

    const commentActivity = await Comment.findAll({
      attributes: [
        [Sequelize.fn('HOUR', Sequelize.col('created_at')), 'hour'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: startDate },
        deleted_at: null
      },
      group: [Sequelize.fn('HOUR', Sequelize.col('created_at'))],
      raw: true
    });

    // 初始化 0-23 小时
    const hours = Array.from({ length: 24 }, (_, i) => `${i}点`);
    const posts = new Array(24).fill(0);
    const comments = new Array(24).fill(0);

    postActivity.forEach(item => {
      posts[item.hour] = parseInt(item.count);
    });

    commentActivity.forEach(item => {
      comments[item.hour] = parseInt(item.count);
    });

    return {
      hours,
      posts,
      comments
    };
  }
}

module.exports = new StatisticsService();
