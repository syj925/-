const { Post, User, Category, PostImage, Comment, Topic, Like, Favorite, sequelize } = require('../models');
const { Op, Sequelize } = require('sequelize');
const redisClient = require('../utils/redis-client');

/**
 * 帖子数据访问层
 */
class PostRepository {
  constructor() {
    // 添加sequelize属性
    this.sequelize = Post.sequelize;
  }

  /**
   * 创建帖子
   * @param {Object} postData 帖子数据
   * @param {Object} options 附加选项，包括事务
   * @returns {Promise<Object>} 创建的帖子对象
   */
  async create(postData, options = {}) {
    return await Post.create(postData, options);
  }

  /**
   * 根据ID查找帖子
   * @param {String} id 帖子ID
   * @param {Boolean} withDetails 是否包含详细信息
   * @returns {Promise<Object>} 帖子对象
   */
  async findById(id, withDetails = false) {
    // 尝试从缓存获取
    const cacheKey = `post:${id}${withDetails ? ':details' : ''}`;
    const cachedPost = await redisClient.get(cacheKey);
    
    if (cachedPost) {
      // 添加类型检查，确保只对字符串进行JSON.parse
      if (typeof cachedPost === 'string') {
        try {
          return JSON.parse(cachedPost);
        } catch (error) {
          console.error(`解析帖子缓存失败 (ID: ${id}):`, error);
          // 如果解析失败，继续执行后续代码查询数据库
        }
      }
    }
    
    // 构建查询选项
    const queryOptions = {
      where: { id },
      include: []
    };
    
    // 加载详细信息
    if (withDetails) {
      queryOptions.include = [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'school', 'department']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        },
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'url', 'thumbnail_url', 'width', 'height', 'order'],
          order: [['order', 'ASC']]
        },
        {
          model: Topic,
          as: 'topics',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ];
    }
    
    const post = await Post.findOne(queryOptions);
    
    // 缓存结果（转换为普通对象避免循环引用）
    if (post) {
      try {
        const plainPost = post.toJSON ? post.toJSON() : post;
        await redisClient.set(cacheKey, JSON.stringify(plainPost), 600); // 缓存10分钟
      } catch (error) {
        console.error(`缓存帖子失败 (ID: ${id}):`, error);
        // 缓存失败不影响正常功能，继续返回数据
      }
    }
    
    return post;
  }

  /**
   * 更新帖子信息
   * @param {String} id 帖子ID
   * @param {Object} postData 帖子数据
   * @returns {Promise<Object>} 更新后的帖子对象
   */
  async update(id, postData) {
    const post = await Post.findByPk(id);
    if (!post) return null;
    
    await post.update(postData);
    
    // 清除缓存
    await redisClient.del(`post:${id}`);
    await redisClient.del(`post:${id}:details`);
    
    return post;
  }

  /**
   * 删除帖子（软删除）
   * @param {String} id 帖子ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async delete(id) {
    const result = await Post.update(
      { status: 'deleted' },
      { where: { id } }
    );
    
    // 清除缓存
    if (result[0] > 0) {
      await redisClient.del(`post:${id}`);
      await redisClient.del(`post:${id}:details`);
    }
    
    return result[0] > 0;
  }

  /**
   * 物理删除帖子
   * @param {String} id 帖子ID
   * @returns {Promise<Boolean>} 是否成功删除
   */
  async hardDelete(id) {
    const result = await Post.destroy({ where: { id } });
    
    // 清除缓存
    if (result > 0) {
      await redisClient.del(`post:${id}`);
      await redisClient.del(`post:${id}:details`);
    }
    
    return result > 0;
  }

  /**
   * 分页查询帖子
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分页结果
   */
  async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      userId,
      categoryId,
      topicId,
      keyword,
      status = 'published',
      orderBy = 'createdAt',
      orderDirection = 'DESC',
      includeDetails = false,
      schoolFilter,
      nearbyLat,
      nearbyLng,
      nearbyDistance = 5 // 默认5公里内
    } = options;
    
    // 构建查询条件
    const where = {};
    
    // 状态过滤
    if (status) {
      if (Array.isArray(status)) {
        where.status = { [Op.in]: status };
      } else {
        where.status = status;
      }
    }
    
    // 用户过滤
    if (userId) {
      where.user_id = userId;
    }
    
    // 分类过滤
    if (categoryId) {
      where.category_id = categoryId;
    }
    
    // 关键词搜索
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    // 学校过滤（需要联表查询用户表）
    let userWhere = {};
    if (schoolFilter) {
      userWhere.school = schoolFilter;
    }
    
    // 构建查询选项
    const queryOptions = {
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [[orderBy, orderDirection]],
      distinct: true
    };
    
    // 设置排序
    if (orderBy === 'hot') {
      queryOptions.order = [
        ['is_top', 'DESC'],
        ['like_count', 'DESC'],
        ['view_count', 'DESC'],
        ['comment_count', 'DESC'],
        ['created_at', 'DESC']
      ];
    } else if (orderBy === 'createdAt') {
      queryOptions.order = [
        ['is_top', 'DESC'],
        ['created_at', 'DESC']
      ];
    }
    
    // 包含关联数据
    queryOptions.include = [];
    
    // 添加作者信息
    queryOptions.include.push({
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'nickname', 'avatar', 'school', 'department'],
      where: userWhere
    });
    
    // 添加分类信息
    queryOptions.include.push({
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'icon']
    });
    
    // 添加图片信息
    queryOptions.include.push({
      model: PostImage,
      as: 'images',
      attributes: ['id', 'url', 'thumbnail_url', 'width', 'height', 'order'],
      order: [['order', 'ASC']],
      separate: true,
      limit: 9
    });
    
    // 添加话题信息
    if (includeDetails) {
      queryOptions.include.push({
        model: Topic,
        as: 'topics',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      });
    }
    
    // 话题过滤
    if (topicId) {
      queryOptions.include.push({
        model: Topic,
        as: 'topicFilter',
        attributes: [],
        through: { attributes: [] },
        where: { id: topicId }
      });
    }
    
    // 位置过滤（附近的帖子）
    if (nearbyLat && nearbyLng) {
      // 使用 Haversine 公式计算距离
      const haversineFormula = `
        6371 * acos(
          cos(radians(${nearbyLat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${nearbyLng})) +
          sin(radians(${nearbyLat})) * sin(radians(latitude))
        )
      `;
      
      queryOptions.attributes = {
        include: [
          [Sequelize.literal(`(${haversineFormula})`), 'distance']
        ]
      };
      
      queryOptions.where.latitude = { [Op.not]: null };
      queryOptions.where.longitude = { [Op.not]: null };
      
      queryOptions.having = Sequelize.literal(`distance < ${nearbyDistance}`);
      
      if (orderBy === 'distance') {
        queryOptions.order = [
          [Sequelize.literal('distance'), 'ASC'],
          ['created_at', 'DESC']
        ];
      }
    }
    
    // 执行查询
    const { rows, count } = await Post.findAndCountAll(queryOptions);
    
    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 增加帖子浏览量
   * @param {String} id 帖子ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async incrementViewCount(id) {
    const result = await Post.increment('view_count', { where: { id } });
    
    // 清除缓存
    await redisClient.del(`post:${id}`);
    await redisClient.del(`post:${id}:details`);
    
    // 修复: 返回布尔值表示是否成功
    return result && result.length > 0;
  }

  /**
   * 更新帖子计数器
   * @param {String} id 帖子ID
   * @param {String} field 字段名
   * @param {Number} value 变化值
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateCounter(id, field, value) {
    if (!['like_count', 'comment_count', 'favorite_count'].includes(field)) {
      throw new Error('Invalid counter field');
    }
    
    const post = await Post.findByPk(id);
    if (!post) return false;
    
    post[field] = Math.max(0, post[field] + value);
    await post.save();
    
    // 清除缓存
    await redisClient.del(`post:${id}`);
    await redisClient.del(`post:${id}:details`);
    
    return true;
  }

  /**
   * 设置置顶状态
   * @param {String} id 帖子ID
   * @param {Boolean} isTop 是否置顶
   * @returns {Promise<Boolean>} 是否成功
   */
  async setTopStatus(id, isTop) {
    const result = await Post.update(
      { is_top: isTop },
      { where: { id } }
    );
    
    // 清除缓存
    if (result[0] > 0) {
      await redisClient.del(`post:${id}`);
      await redisClient.del(`post:${id}:details`);
    }
    
    return result[0] > 0;
  }

  /**
   * 关联帖子与话题
   * @param {String} postId 帖子ID
   * @param {Array<Number>} topicIds 话题ID数组
   * @returns {Promise<Boolean>} 是否成功
   */
  async associateWithTopics(postId, topicIds) {
    const post = await Post.findByPk(postId);
    if (!post) return false;
    
    // 重新设置关联的话题
    await post.setTopics(topicIds);
    
    // 清除缓存
    await redisClient.del(`post:${postId}`);
    await redisClient.del(`post:${postId}:details`);
    
    // 更新话题的帖子计数
    for (const topicId of topicIds) {
      await Topic.increment('post_count', { where: { id: topicId } });
    }
    
    return true;
  }

  /**
   * 查询热门帖子
   * @param {Number} limit 限制数量
   * @returns {Promise<Array>} 帖子列表
   */
  async findHotPosts(limit = 10) {
    // 尝试从缓存获取
    const cacheKey = `hot_posts:${limit}`;
    const cachedPosts = await redisClient.get(cacheKey);
    
    if (cachedPosts) {
      // 添加类型检查，确保只对字符串进行JSON.parse
      if (typeof cachedPosts === 'string') {
        try {
          return JSON.parse(cachedPosts);
        } catch (error) {
          console.error('解析热门帖子缓存失败:', error);
          // 如果解析失败，继续执行后续代码查询数据库
        }
      }
    }
    
    const posts = await Post.findAll({
      where: {
        status: 'published',
        created_at: {
          [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) // 最近7天
        }
      },
      order: [
        ['like_count', 'DESC'],
        ['view_count', 'DESC'],
        ['comment_count', 'DESC']
      ],
      limit,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        },
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'url', 'thumbnail_url'],
          limit: 1
        }
      ]
    });
    
    // 缓存结果
    await redisClient.set(cacheKey, JSON.stringify(posts), 1800); // 缓存30分钟
    
    return posts;
  }

  /**
   * 获取帖子评论列表
   * @param {String} postId 帖子ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @param {String} sort 排序方式：latest, hot, most_liked
   * @returns {Promise<Object>} 分页结果
   */
  async getComments(postId, page = 1, pageSize = 20, sort = 'latest') {
    // 构建排序条件
    let order;
    switch (sort) {
      case 'hot':
        // 热门排序：使用热度分数算法
        order = [
          [
            sequelize.literal(`(
              0.7 * LOG(Comment.like_count + 1) +
              0.3 * EXP(-0.1 * TIMESTAMPDIFF(HOUR, Comment.created_at, NOW()))
            )`),
            'DESC'
          ],
          [sequelize.col('Comment.created_at'), 'DESC']
        ];
        break;
      case 'most_liked':
        // 点赞最多排序
        order = [[sequelize.col('Comment.like_count'), 'DESC'], [sequelize.col('Comment.created_at'), 'DESC']];
        break;
      case 'latest':
      default:
        // 最新排序（默认）
        order = [[sequelize.col('Comment.created_at'), 'DESC']];
        break;
    }

    const { rows, count } = await Comment.findAndCountAll({
      where: {
        post_id: postId,
        reply_to: null, // 只查询顶级评论
        status: 'normal'
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order,
      attributes: [
        'id', 'content', 'user_id', 'post_id', 'reply_to', 'like_count', 'status', 'is_anonymous', 'created_at', 'updated_at', 'deleted_at',
        // 添加热度分数计算
        [
          sequelize.literal(`(
            0.7 * LOG(Comment.like_count + 1) +
            0.3 * EXP(-0.1 * TIMESTAMPDIFF(HOUR, Comment.created_at, NOW()))
          )`),
          'hot_score'
        ],
        // 添加热门标识判定
        [
          sequelize.literal(`(
            Comment.like_count >= 5 AND (
              0.7 * LOG(Comment.like_count + 1) +
              0.3 * EXP(-0.1 * TIMESTAMPDIFF(HOUR, Comment.created_at, NOW()))
            ) > 1.5
          ) OR Comment.like_count >= 10`),
          'is_hot'
        ]
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: Comment,
          as: 'replies',
          where: { status: 'normal' },
          required: false,
          limit: 3,
          order: [['created_at', 'ASC']],
          attributes: ['id', 'content', 'user_id', 'post_id', 'reply_to', 'like_count', 'status', 'is_anonymous', 'created_at', 'updated_at'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'nickname', 'avatar']
            }
          ]
        }
      ]
    });
    
    return {
      list: rows,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total: count
      }
    };
  }

  /**
   * 检查用户是否已点赞该帖子
   * @param {String} postId 帖子ID
   * @param {String} userId 用户ID
   * @returns {Promise<Boolean>} 是否已点赞
   */
  async isLikedByUser(postId, userId) {
    const count = await Like.count({
      where: {
        target_id: postId,
        user_id: userId,
        target_type: 'post'
      }
    });
    return count > 0;
  }

  /**
   * 检查用户是否已收藏该帖子
   * @param {String} postId 帖子ID
   * @param {String} userId 用户ID
   * @returns {Promise<Boolean>} 是否已收藏
   */
  async isFavoritedByUser(postId, userId) {
    const count = await Favorite.count({
      where: {
        post_id: postId,
        user_id: userId
      }
    });
    return count > 0;
  }
}

module.exports = new PostRepository(); 