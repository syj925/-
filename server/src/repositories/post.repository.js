const { Post, User, Category, PostImage, Comment, Topic, Like, Favorite, Setting, Badge, UserBadge, sequelize } = require('../models');
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
        // 注意：不要手动JSON.stringify，Redis客户端会自动处理序列化
        await redisClient.set(cacheKey, plainPost, 600); // 缓存10分钟
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
      nearbyDistance = 5, // 默认5公里内
      onlyRecommended = false // 🔥 新增：是否只显示上过推荐的帖子
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
    
    // 🔥 推荐过滤：只显示上过推荐的帖子
    if (onlyRecommended) {
      // 使用独立的OR条件，表示帖子必须曾经被推荐过（管理员推荐或算法推荐）
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        [Op.or]: [
          { is_recommended: true },     // 管理员推荐过的
          { auto_recommended: true }    // 算法推荐过的
        ]
      });
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
    } else if (orderBy === 'recommended') {
      // 推荐算法排序：管理员推荐优先，然后按权重算法排序
      const { sequelize } = require('../../config/database');

      // 获取推荐算法权重配置
      const recommendSettings = await this.getRecommendSettings();

      queryOptions.order = [
        ['is_top', 'DESC'],
        ['is_recommended', 'DESC'], // 管理员推荐优先
        // 使用权重算法计算热度分数
        [sequelize.literal(`
          (like_count * ${recommendSettings.likeWeight} +
           comment_count * ${recommendSettings.commentWeight} +
           favorite_count * ${recommendSettings.collectionWeight} +
           view_count * ${recommendSettings.viewWeight} +
           (CASE WHEN DATEDIFF(NOW(), created_at) <= ${recommendSettings.maxAgeDays}
            THEN EXP(-DATEDIFF(NOW(), created_at) / ${recommendSettings.timeDecayDays}) * 10
            ELSE 0 END)
          )`), 'DESC'],
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
    
    // 添加作者信息（包含徽章）
    queryOptions.include.push({
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'nickname', 'avatar', 'school', 'department'],
      where: userWhere,
      include: [{
        model: UserBadge,
        as: 'userBadges',  // 修正别名，匹配模型定义
        where: {
          is_visible: true  // 只获取可见的徽章
        },
        required: false,  // 左联接，用户没有徽章也要返回
        include: [{
          model: Badge,
          as: 'badge',
          where: {
            status: 'active',
            type: 'achievement'  // 只获取成就类徽章
          },
          attributes: ['id', 'name', 'description', 'color', 'icon', 'rarity']
        }],
        // 在主查询的order中处理排序，而不是在include中
        // limit在include中不可靠，我们在应用层处理
      }]
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
          attributes: ['id', 'username', 'nickname', 'avatar'],
          include: [{
            model: UserBadge,
            as: 'userBadges',
            where: {
              is_visible: true
            },
            required: false,
            include: [{
              model: Badge,
              as: 'badge',
              where: {
                status: 'active',
                type: 'achievement'
              },
              attributes: ['id', 'name', 'description', 'color', 'icon', 'rarity']
            }]
          }]
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
        'id', 'content', 'user_id', 'post_id', 'reply_to', 'like_count', 'reply_count', 'status', 'is_anonymous', 'images', 'emoji_image', 'created_at', 'updated_at', 'deleted_at',
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
        ],
        // 动态计算回复数量
        [
          sequelize.literal(`(
            SELECT COUNT(*) 
            FROM comments AS reply_comments 
            WHERE reply_comments.reply_to = Comment.id 
            AND reply_comments.status = 'normal'
            AND reply_comments.deleted_at IS NULL
          )`),
          'calculated_reply_count'
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
          attributes: ['id', 'content', 'user_id', 'post_id', 'reply_to', 'like_count', 'status', 'is_anonymous', 'images', 'emoji_image', 'created_at', 'updated_at'],
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'username', 'nickname', 'avatar']
            },
            {
              model: Comment,
              as: 'parentComment',
              required: false,
              attributes: ['id'],
              include: [
                {
                  model: User,
                  as: 'author',
                  attributes: ['id', 'nickname', 'username']
                }
              ]
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

  /**
   * 获取推荐算法配置参数
   * @returns {Promise<Object>} 权重参数对象
   */
  async getRecommendSettings() {
    try {
      // 获取所有推荐相关设置
      const settings = await Setting.findAll({
        where: {
          key: {
            [Op.in]: ['likeWeight', 'commentWeight', 'collectionWeight', 'viewWeight',
                    'timeDecayDays', 'maxAgeDays', 'maxAdminRecommended']
          }
        }
      });

      // 默认配置
      const defaultSettings = {
        likeWeight: 2.0,
        commentWeight: 3.0,
        collectionWeight: 4.0,
        viewWeight: 0.5,
        timeDecayDays: 10,
        maxAgeDays: 30,
        maxAdminRecommended: 5
      };

      // 使用数据库配置覆盖默认值
      settings.forEach(setting => {
        const key = setting.key;
        if (['likeWeight', 'commentWeight', 'collectionWeight', 'viewWeight'].includes(key)) {
          defaultSettings[key] = parseFloat(setting.value);
        } else {
          defaultSettings[key] = parseInt(setting.value);
        }
      });

      return defaultSettings;
    } catch (error) {
      logger.error('获取推荐设置失败:', error);
      // 返回默认设置
      return {
        likeWeight: 2.0,
        commentWeight: 3.0,
        collectionWeight: 4.0,
        viewWeight: 0.5,
        timeDecayDays: 10,
        maxAgeDays: 30,
        maxAdminRecommended: 5
      };
    }
  }

  /**
   * 获取推荐算法的候选帖子
   * @param {Object} options 查询选项
   * @returns {Promise<Array>} 候选帖子列表
   */
  async findCandidatesForRecommendation(options = {}) {
    const {
      pageSize = 50,
      excludeIds = [],
      maxAgeDays = 30,
      includeDetails = true,
      minInteractionScore = 2 // 最低互动分数阈值
    } = options;

    // 构建查询条件
    const whereCondition = {
      status: 'published'
    };

    // 排除指定帖子
    if (excludeIds.length > 0) {
      whereCondition.id = {
        [Op.notIn]: excludeIds
      };
    }

    // 时间限制
    if (maxAgeDays > 0) {
      const maxAgeDate = new Date();
      maxAgeDate.setDate(maxAgeDate.getDate() - maxAgeDays);
      whereCondition.created_at = {
        [Op.gte]: maxAgeDate
      };
    }

    // 质量筛选：至少有一定的互动量
    // 计算互动分数：点赞*1 + 评论*2 + 收藏*3 + 浏览/10
    whereCondition[Op.and] = [
      Sequelize.literal(`
        (like_count * 1 + comment_count * 2 + favorite_count * 3 + view_count * 0.1) >= ${minInteractionScore}
        OR is_recommended = 1
        OR is_top = 1
      `)
    ];

    const queryOptions = {
      where: whereCondition,
      limit: pageSize,
      order: [['created_at', 'DESC']]
    };

    // 包含详细信息
    if (includeDetails) {
      queryOptions.include = [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname', 'avatar', 'school', 'department']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: PostImage,
          as: 'images',
          attributes: ['id', 'url', 'thumbnail_url']
        },
        {
          model: Topic,
          as: 'topics',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ];
    }

    const posts = await Post.findAll(queryOptions);
    return posts.map(post => {
      const jsonPost = post.toJSON();
      // 确保移除可能的循环引用
      return this.cleanPostData(jsonPost);
    });
  }

  /**
   * 批量获取用户点赞的帖子ID
   * @param {String} userId 用户ID
   * @param {Array} postIds 帖子ID数组
   * @returns {Promise<Array>} 已点赞的帖子ID数组
   */
  async getUserLikedPosts(userId, postIds) {
    try {
      const likes = await Like.findAll({
        where: {
          user_id: userId,
          target_type: 'post',
          target_id: {
            [Op.in]: postIds
          }
        },
        attributes: ['target_id']
      });

      return likes.map(like => like.target_id);
    } catch (error) {
      console.error('获取用户点赞帖子失败:', error);
      return [];
    }
  }

  /**
   * 批量获取用户收藏的帖子ID
   * @param {String} userId 用户ID
   * @param {Array} postIds 帖子ID数组
   * @returns {Promise<Array>} 已收藏的帖子ID数组
   */
  async getUserFavoritedPosts(userId, postIds) {
    try {
      const favorites = await Favorite.findAll({
        where: {
          user_id: userId,
          post_id: {
            [Op.in]: postIds
          }
        },
        attributes: ['post_id']
      });

      return favorites.map(favorite => favorite.post_id);
    } catch (error) {
      console.error('获取用户收藏帖子失败:', error);
      return [];
    }
  }

  /**
   * 清理帖子数据，移除可能的循环引用
   * @param {Object} postData 帖子数据
   * @returns {Object} 清理后的帖子数据
   */
  cleanPostData(postData) {
    if (!postData || typeof postData !== 'object') {
      return postData;
    }

    const cleaned = {};

    for (const [key, value] of Object.entries(postData)) {
      // 跳过可能导致循环引用的属性
      if (this.shouldSkipProperty(key, value)) {
        continue;
      }

      // 递归处理嵌套对象
      if (Array.isArray(value)) {
        cleaned[key] = value.map(item =>
          typeof item === 'object' && item !== null ? this.cleanPostData(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.cleanPostData(value);
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * 判断是否应该跳过某个属性
   * @param {string} key 属性名
   * @param {*} value 属性值
   * @returns {boolean} 是否跳过
   */
  shouldSkipProperty(key, value) {
    // Sequelize 相关属性
    const sequelizeProps = [
      'parent', 'include', 'sequelize', '_options', '_changed', '_previousDataValues',
      'dataValues', '_modelOptions', '_model', 'Model', 'constructor', '__proto__',
      'isNewRecord', '_customGetters', '_customSetters'
    ];

    if (sequelizeProps.includes(key)) {
      return true;
    }

    // 函数类型
    if (typeof value === 'function') {
      return true;
    }

    // Symbol 类型
    if (typeof value === 'symbol') {
      return true;
    }

    return false;
  }

  /**
   * 按分类统计帖子数量
   * @param {Number} categoryId 分类ID
   * @param {String} status 帖子状态
   * @returns {Promise<Number>} 帖子数量
   */
  async countByCategory(categoryId, status = 'published') {
    const where = {
      status,
      deleted_at: null
    };

    if (categoryId) {
      where.category_id = categoryId;
    }

    return await Post.count({ where });
  }

  /**
   * 获取所有分类的帖子统计
   * @param {String} status 帖子状态
   * @returns {Promise<Array>} 分类统计数据
   */
  async getCategoryStats(status = 'published') {
    const { sequelize } = require('../models');

    const results = await sequelize.query(`
      SELECT
        c.id,
        c.name,
        c.icon,
        COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id
        AND p.status = :status
        AND p.deleted_at IS NULL
      GROUP BY c.id, c.name, c.icon
      ORDER BY c.sort ASC, c.id ASC
    `, {
      replacements: { status },
      type: sequelize.QueryTypes.SELECT
    });

    return results;
  }

  /**
   * 统计用户发布的帖子数量
   * @param {String} userId 用户ID
   * @param {String} status 帖子状态
   * @returns {Promise<Number>} 帖子数量
   */
  async countByUserId(userId, status = 'published') {
    return await Post.count({
      where: {
        user_id: userId,
        status,
        deleted_at: null
      }
    });
  }
  /**
   * 更新帖子计数字段
   * @param {String} postId 帖子ID
   * @param {String} field 计数字段名 (like_count, favorite_count, comment_count, view_count)
   * @param {Number} increment 增量值（正数增加，负数减少）
   * @returns {Promise<Boolean>} 是否成功
   */
  async updateCounter(postId, field, increment = 1) {
    try {
      // 验证字段名，防止SQL注入
      const allowedFields = ['like_count', 'favorite_count', 'comment_count', 'view_count'];
      if (!allowedFields.includes(field)) {
        throw new Error(`不允许的计数字段: ${field}`);
      }

      // 使用Sequelize的increment方法更新计数
      const [affectedRows] = await Post.increment(field, {
        by: increment,
        where: { id: postId }
      });

      // 清除相关缓存
      const cacheKey = `post:${postId}`;
      try {
        await redisClient.del(cacheKey);
        await redisClient.del(`${cacheKey}:details`);
      } catch (cacheError) {
        console.error(`清除帖子缓存失败 (ID: ${postId}):`, cacheError);
        // 缓存清除失败不影响主要功能
      }

      return affectedRows > 0;
    } catch (error) {
      console.error(`更新帖子计数失败 (ID: ${postId}, field: ${field}, increment: ${increment}):`, error);
      throw error;
    }
  }
}

module.exports = new PostRepository();