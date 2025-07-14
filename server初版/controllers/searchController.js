const { Post, User, Topic, Comment, Setting } = require('../models/associations');
const { Op } = require('sequelize');

/**
 * @desc    搜索帖子、话题和用户
 * @route   GET /api/search
 * @access  Public
 */
exports.search = async (req, res, next) => {
  try {
    // 获取查询参数
    const keyword = req.query.keyword || '';
    const type = req.query.type || 'all'; // all, post, user, topic
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // 如果关键词为空
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    let posts = [];
    let users = [];
    let topics = [];
    let totalPosts = 0;
    let totalUsers = 0;
    let totalTopics = 0;
    
    // 根据类型执行不同的搜索
    if (type === 'all' || type === 'post') {
      // 搜索帖子
      const postResult = await Post.findAndCountAll({
        where: {
          [Op.or]: [
            { content: { [Op.like]: `%${keyword}%` } }
          ],
          status: 'published'
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'nickname', 'username', 'avatar']
          },
          {
            model: Topic,
            as: 'topicList',
            attributes: ['id', 'name'],
            through: { attributes: [] }
          }
        ],
        order: [['created_at', 'DESC']],
        limit: type === 'all' ? 5 : limit,
        offset: type === 'all' ? 0 : offset,
        distinct: true
      });
      
      posts = postResult.rows;
      totalPosts = postResult.count;
    }
    
    if (type === 'all' || type === 'user') {
      // 搜索用户
      const userResult = await User.findAndCountAll({
        where: {
          [Op.or]: [
            { nickname: { [Op.like]: `%${keyword}%` } },
            { username: { [Op.like]: `%${keyword}%` } },
            { bio: { [Op.like]: `%${keyword}%` } }
          ],
          status: 'active'
        },
        attributes: ['id', 'nickname', 'username', 'avatar', 'bio'],
        order: [['created_at', 'DESC']],
        limit: type === 'all' ? 5 : limit,
        offset: type === 'all' ? 0 : offset
      });
      
      users = userResult.rows;
      totalUsers = userResult.count;
    }
    
    if (type === 'all' || type === 'topic') {
      // 搜索话题
      const topicResult = await Topic.findAndCountAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } }
          ],
          status: 'active'
        },
        attributes: ['id', 'name', 'description', 'coverImage', 'usageCount', 'created_at'],
        order: [['usageCount', 'DESC']],
        limit: type === 'all' ? 5 : limit,
        offset: type === 'all' ? 0 : offset
      });
      
      topics = topicResult.rows;
      totalTopics = topicResult.count;
    }
    
    // 根据搜索类型构建响应数据
    let responseData = {};
    
    if (type === 'all') {
      // 如果是全部搜索，返回所有类型的结果
      responseData = {
        posts: {
          data: posts,
          total: totalPosts
        },
        users: {
          data: users,
          total: totalUsers
        },
        topics: {
          data: topics,
          total: totalTopics
        }
      };
    } else if (type === 'post') {
      // 如果只搜索帖子
      const totalPages = Math.ceil(totalPosts / limit);
      
      responseData = {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: totalPages
        }
      };
    } else if (type === 'user') {
      // 如果只搜索用户
      const totalPages = Math.ceil(totalUsers / limit);
      
      responseData = {
        users,
        pagination: {
          page,
          limit,
          total: totalUsers,
          pages: totalPages
        }
      };
    } else if (type === 'topic') {
      // 如果只搜索话题
      const totalPages = Math.ceil(totalTopics / limit);
      
      responseData = {
        topics,
        pagination: {
          page,
          limit,
          total: totalTopics,
          pages: totalPages
        }
      };
    }
    
    // 响应搜索结果
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    搜索帖子
 * @route   GET /api/search/posts
 * @access  Public
 */
exports.searchPosts = async (req, res, next) => {
  try {
    // 获取查询参数
    const keyword = req.query.keyword || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const topicId = req.query.topicId;
    
    // 如果关键词为空
    if (!keyword && !topicId) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词或话题ID'
      });
    }
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 构建搜索条件
    const whereCondition = {
      status: 'published'
    };
    
    // 如果有关键词，添加关键词搜索条件
    if (keyword) {
      whereCondition[Op.or] = [
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    // 构建包含条件
    const includeCondition = [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'nickname', 'username', 'avatar']
      }
    ];
    
    // 如果有话题ID，添加话题筛选条件
    if (topicId) {
      includeCondition.push({
        model: Topic,
        as: 'topicList',
        where: {
          id: topicId
        },
        attributes: ['id', 'name'],
        through: { attributes: [] }
      });
    } else {
      // 如果没有指定话题，仍然获取帖子的话题，但不作为筛选条件
      includeCondition.push({
        model: Topic,
        as: 'topicList',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        required: false
      });
    }
    
    // 搜索帖子
    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereCondition,
      include: includeCondition,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: count,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取热门搜索词
 * @route   GET /api/search/hot
 * @access  Public
 */
exports.getHotSearches = async (req, res, next) => {
  try {
    let hotKeywords = [];
    
    // 1. 从设置中获取管理员配置的热门搜索词
    const hotSearchSetting = await Setting.findOne({
      where: { key: 'hotSearchKeywords' }
    });
    
    if (hotSearchSetting && hotSearchSetting.value) {
      try {
        // 如果值是JSON格式数组
        if (hotSearchSetting.value.startsWith('[') && hotSearchSetting.value.endsWith(']')) {
          const parsedValue = JSON.parse(hotSearchSetting.value);
          if (Array.isArray(parsedValue) && parsedValue.length > 0) {
            hotKeywords = parsedValue;
          }
        } else if (hotSearchSetting.value.includes('\n')) {
          // 如果是多行文本格式，按行分割
          hotKeywords = hotSearchSetting.value
            .split('\n')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0);
        } else {
          // 如果是单个值
          hotKeywords = [hotSearchSetting.value.trim()];
        }
      } catch (error) {
        console.error('解析热门搜索词配置失败:', error);
      }
    }
    
    // 2. 如果配置为空，生成系统默认的热门搜索词（通过近期帖子分析）
    if (hotKeywords.length === 0) {
      // 获取最近30天内的帖子
      const recentPosts = await Post.findAll({
        where: {
          status: 'published',
          created_at: {
            [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['views', 'DESC']],
        limit: 20
      });
      
      // 分析帖子内容，提取潜在的关键词
      const keywordMap = {};
      
      recentPosts.forEach(post => {
        // 提取话题作为关键词
        if (post.topics && Array.isArray(post.topics)) {
          post.topics.forEach(topic => {
            if (!keywordMap[topic]) {
              keywordMap[topic] = 0;
            }
            keywordMap[topic]++;
          });
        }
        
        // 从内容中提取可能的关键词（简化处理，实际可使用NLP库）
        const content = post.content || '';
        const words = content
          .split(/\s+/)
          .filter(word => word.length >= 2)
          .slice(0, 5); // 取前5个词
        
        words.forEach(word => {
          if (!keywordMap[word]) {
            keywordMap[word] = 0;
          }
          keywordMap[word]++;
        });
      });
      
      // 转换为数组并排序
      hotKeywords = Object.entries(keywordMap)
        .sort((a, b) => b[1] - a[1]) // 按出现频率排序
        .slice(0, 10) // 取前10个
        .map(item => item[0]); // 只取关键词
      
      // 如果还是为空，提供默认关键词
      if (hotKeywords.length === 0) {
        hotKeywords = ['校园活动', '期末考试', '寻物启事', '二手交易', '实习招聘', '美食推荐', '考研资料'];
      }
    }
    
    // 返回热门搜索词
    res.status(200).json({
      success: true,
      data: {
        keywords: hotKeywords
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取搜索建议
 * @route   GET /api/search/suggestions
 * @access  Public
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    
    // 如果关键词为空
    if (!keyword || keyword.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }
    
    const trimmedKeyword = keyword.trim();
    let suggestions = [];
    
    // 1. 从话题中获取建议
    const topicSuggestions = await Topic.findAll({
      where: {
        name: {
          [Op.like]: `%${trimmedKeyword}%`
        },
        status: 'active'
      },
      order: [['usageCount', 'DESC']],
      limit: 5,
      attributes: ['name']
    });
    
    suggestions = topicSuggestions.map(topic => topic.name);
    
    // 2. 从热门帖子内容中获取建议
    if (suggestions.length < 5) {
      const postSuggestions = await Post.findAll({
        where: {
          content: {
            [Op.like]: `%${trimmedKeyword}%`
          },
          status: 'published'
        },
        order: [['views', 'DESC']],
        limit: 5 - suggestions.length,
        attributes: ['content']
      });
      
      // 从帖子内容中提取包含关键词的短语
      postSuggestions.forEach(post => {
        const content = post.content || '';
        
        // 简单提取包含关键词的部分（实际可使用更复杂的语义分析）
        const index = content.toLowerCase().indexOf(trimmedKeyword.toLowerCase());
        if (index >= 0) {
          // 提取关键词周围的一段文本
          const start = Math.max(0, index - 10);
          const end = Math.min(content.length, index + trimmedKeyword.length + 10);
          let phrase = content.substring(start, end).trim();
          
          // 如果截取的内容不是以词开头，则找到第一个空格后的位置
          if (start > 0) {
            const firstSpace = phrase.indexOf(' ');
            if (firstSpace > 0) {
              phrase = phrase.substring(firstSpace + 1);
            }
          }
          
          // 如果截取的内容不是以词结尾，则找到最后一个空格的位置
          if (end < content.length) {
            const lastSpace = phrase.lastIndexOf(' ');
            if (lastSpace > 0 && lastSpace < phrase.length - 1) {
              phrase = phrase.substring(0, lastSpace);
            }
          }
          
          if (phrase && !suggestions.includes(phrase) && phrase.length > trimmedKeyword.length) {
            suggestions.push(phrase);
          } else if (!suggestions.includes(trimmedKeyword)) {
            // 如果没有提取到合适的短语，则添加关键词本身
            suggestions.push(trimmedKeyword);
          }
        }
      });
    }
    
    // 3. 从用户名中获取建议
    if (suggestions.length < 5) {
      const userSuggestions = await User.findAll({
        where: {
          [Op.or]: [
            { nickname: { [Op.like]: `%${trimmedKeyword}%` } },
            { username: { [Op.like]: `%${trimmedKeyword}%` } }
          ],
          status: 'active'
        },
        limit: 5 - suggestions.length,
        attributes: ['nickname', 'username']
      });
      
      userSuggestions.forEach(user => {
        const nameToAdd = user.nickname || user.username;
        if (nameToAdd && !suggestions.includes(nameToAdd)) {
          suggestions.push(nameToAdd);
        }
      });
    }
    
    // 确保建议不重复
    suggestions = [...new Set(suggestions)];
    
    // 如果建议为空，添加简单的搜索建议
    if (suggestions.length === 0) {
      suggestions = [
        trimmedKeyword,
        `${trimmedKeyword} 相关内容`,
        `查找 ${trimmedKeyword}`
      ];
    }
    
    // 返回搜索建议
    res.status(200).json({
      success: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    搜索用户
 * @route   GET /api/search/users
 * @access  Public
 */
exports.searchUsers = async (req, res, next) => {
  try {
    // 获取查询参数
    const keyword = req.query.keyword || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // 如果关键词为空
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 搜索用户
    const { count, rows: users } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { nickname: { [Op.like]: `%${keyword}%` } },
          { username: { [Op.like]: `%${keyword}%` } },
          { bio: { [Op.like]: `%${keyword}%` } }
        ],
        status: 'active'
      },
      attributes: ['id', 'nickname', 'username', 'avatar', 'bio', 'created_at'],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    // 处理用户数据，添加关注状态等信息（如果用户已登录）
    const processedUsers = users.map(user => {
      const userData = user.toJSON();
      
      // 这里可以添加关注状态等信息，但需要根据当前登录用户来确定
      // 默认为未关注
      userData.isFollowed = false;
      
      return userData;
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 构建分页信息
    const pagination = {
      page,
      limit,
      total: count,
      pages: totalPages,
      hasNextPage: page < totalPages
    };
    
    // 返回搜索结果
    res.status(200).json({
      success: true,
      data: {
        users: processedUsers,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    搜索话题
 * @route   GET /api/search/topics
 * @access  Public
 */
exports.searchTopics = async (req, res, next) => {
  try {
    // 获取查询参数
    const keyword = req.query.keyword || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // 如果关键词为空
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }
    
    // 计算跳过的记录数
    const offset = (page - 1) * limit;
    
    // 搜索话题
    const { count, rows: topics } = await Topic.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ],
        status: 'active'
      },
      attributes: ['id', 'name', 'description', 'coverImage', 'usageCount', 'created_at'],
      order: [['usageCount', 'DESC']],
      limit,
      offset
    });
    
    // 处理话题数据
    const processedTopics = await Promise.all(topics.map(async topic => {
      const topicData = topic.toJSON();
      
      // 获取话题下的帖子数量
      const postCount = await Post.count({
        include: [
          {
            model: Topic,
            as: 'topicList',
            where: { id: topic.id },
            through: { attributes: [] }
          }
        ]
      });
      
      topicData.postCount = postCount;
      return topicData;
    }));
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 构建分页信息
    const pagination = {
      page,
      limit,
      total: count,
      pages: totalPages,
      hasNextPage: page < totalPages
    };
    
    // 返回搜索结果
    res.status(200).json({
      success: true,
      data: {
        topics: processedTopics,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    获取话题热榜
 * @route   GET /api/topics/trending
 * @access  Public
 */
exports.getTrendingTopics = async (req, res, next) => {
  try {
    // 1. 获取配置的话题热榜设置
    const [topicBaseWeightSetting, topicRecentWeightSetting, topicRecentDaysSetting, maxHotTopicsSetting, featuredTopicIdsSetting] = await Promise.all([
      Setting.findOne({ where: { key: 'topicBaseWeight' } }),
      Setting.findOne({ where: { key: 'topicRecentWeight' } }),
      Setting.findOne({ where: { key: 'topicRecentDays' } }),
      Setting.findOne({ where: { key: 'maxHotTopics' } }),
      Setting.findOne({ where: { key: 'featuredTopicIds' } })
    ]);
    
    // 设置默认值和从设置中获取值
    const topicBaseWeight = topicBaseWeightSetting ? parseFloat(topicBaseWeightSetting.value) || 0.7 : 0.7;
    const topicRecentWeight = topicRecentWeightSetting ? parseFloat(topicRecentWeightSetting.value) || 0.3 : 0.3;
    const topicRecentDays = topicRecentDaysSetting ? parseInt(topicRecentDaysSetting.value) || 7 : 7;
    const maxHotTopics = maxHotTopicsSetting ? parseInt(maxHotTopicsSetting.value) || 10 : 10;
    
    let featuredTopicIds = [];
    if (featuredTopicIdsSetting && featuredTopicIdsSetting.value) {
      try {
        featuredTopicIds = JSON.parse(featuredTopicIdsSetting.value);
      } catch (error) {
        console.error('解析特色话题ID失败:', error);
      }
    }
    
    // 检查请求中的limit参数
    const requestedLimit = parseInt(req.query.limit, 10) || maxHotTopics;
    const limit = Math.min(requestedLimit, 20); // 限制最大数量为20
    
    // 2. 获取所有活跃话题
    const trendingTopics = await Topic.findAll({
      where: {
        status: 'active'
      },
      attributes: ['id', 'name', 'description', 'coverImage', 'usageCount', 'created_at'],
      order: [['usageCount', 'DESC']],
      limit: Math.max(limit, featuredTopicIds.length + 5) // 确保检索足够多的话题以包含推荐话题
    });
    
    // 3. 计算每个话题的热度分数
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - topicRecentDays);
    
    // 处理话题数据，添加帖子数量和热度得分
    const processedTopics = await Promise.all(trendingTopics.map(async topic => {
      const topicData = topic.toJSON();
      
      // 获取话题下的帖子数量
      const postCount = await Post.count({
        include: [
          {
            model: Topic,
            as: 'topicList',
            where: { id: topic.id },
            through: { attributes: [] }
          }
        ]
      });
      
      topicData.postCount = postCount;
      
      // 获取最近n天内的话题热度增长
      const recentPostsCount = await Post.count({
        where: {
          created_at: {
            [Op.gte]: weekAgo
          },
          status: 'published'
        },
        include: [
          {
            model: Topic,
            as: 'topicList',
            where: { id: topic.id },
            through: { attributes: [] }
          }
        ]
      });
      
      // 热度指数 = 总使用量 * baseWeight + 最近n天的新增帖子数 * recentWeight
      topicData.trendingScore = Math.round(topic.usageCount * topicBaseWeight + recentPostsCount * topicRecentWeight);
      
      // 添加是否为推荐话题的标志
      topicData.isFeatured = featuredTopicIds.includes(topic.id);
      
      return topicData;
    }));
    
    // 4. 排序：优先推荐话题，然后按热度得分降序排列
    processedTopics.sort((a, b) => {
      // 优先级1：推荐话题优先
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }
      // 优先级2：热度得分
      return b.trendingScore - a.trendingScore;
    });
    
    // 5. 截取指定数量的话题
    const finalTopics = processedTopics.slice(0, limit);
    
    // 返回话题热榜
    res.status(200).json({
      success: true,
      data: {
        topics: finalTopics
      }
    });
  } catch (error) {
    next(error);
  }
}; 