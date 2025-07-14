const { Follow, User, sequelize } = require('../models/associations');
const { Op } = require('sequelize');

/**
 * @desc    关注用户
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
exports.followUser = async (req, res, next) => {
  try {
    // 检查用户是否已登录
    if (!req.user || !req.user.id) {
      console.error('用户未登录或req.user不存在:', req.user);
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    console.log('关注接口 - 已登录用户信息:', { 
      id: req.user.id, 
      username: req.user.username,
      isUserObject: !!req.user
    });
    
    // 获取要关注的用户ID和备注
    const followingId = parseInt(req.params.id, 10);
    const { remark } = req.body;
    
    // 确保followingId是有效整数
    if (isNaN(followingId) || followingId <= 0) {
      console.error(`无效的用户ID: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: '无效的用户ID'
      });
    }
    
    console.log(`关注接口 - 当前用户[${req.user.id}]尝试关注用户[${followingId}]`);
    
    // 不能关注自己
    if (followingId == req.user.id) {
      console.log(`用户[${req.user.id}]尝试关注自己，操作被拒绝`);
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }
    
    try {
      // 查询被关注用户是否存在
      const followingUser = await User.findByPk(followingId);
      
      if (!followingUser) {
        console.log(`用户[${followingId}]不存在，无法关注`);
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      console.log(`用户[${req.user.id}]尝试关注用户[${followingId}] (${followingUser.username})`);
      
      // 查询是否已经关注过该用户
      const existingFollow = await Follow.findOne({
        where: {
          followerId: req.user.id,
          followingId
        }
      });
      
      // 如果已经关注过，返回成功信息而不是错误
      if (existingFollow) {
        console.log(`用户[${req.user.id}]已经关注过用户[${followingId}]`);
        return res.status(200).json({
          success: true,
          message: '已经关注该用户',
          data: { isFollowing: true }
        });
      }
      
      // 创建关注关系
      const newFollow = await Follow.create({
        followerId: req.user.id,
        followingId,
        remark: remark || null
      });
      
      console.log(`用户[${req.user.id}]成功关注用户[${followingId}]，记录ID: ${newFollow.id}`);
      
      // 响应成功信息
      return res.status(200).json({
        success: true,
        message: '关注成功',
        data: { isFollowing: true }
      });
    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      throw dbError;  // 抛出错误以便在外层捕获
    }
  } catch (error) {
    console.error('关注用户时发生错误:', error);
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 返回具体错误信息
    let errorMessage = '关注用户失败，请稍后再试';
    let statusCode = 500;
    let errorDetail = null;
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      errorMessage = '关注的用户不存在';
      statusCode = 400;
      errorDetail = 'foreign_key_constraint';
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      // 唯一性约束错误，说明已经关注过了
      return res.status(200).json({
        success: true,
        message: '已经关注该用户',
        data: { isFollowing: true }
      });
    } else if (error.name === 'SequelizeValidationError') {
      errorMessage = '提供的数据无效';
      statusCode = 400;
      errorDetail = 'validation_error';
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorType: error.name,
      errorDetail
    });
  }
};

/**
 * @desc    取消关注用户
 * @route   DELETE /api/users/:id/follow
 * @access  Private
 */
exports.unfollowUser = async (req, res, next) => {
  try {
    // 检查用户是否已登录
    if (!req.user || !req.user.id) {
      console.error('用户未登录或req.user不存在:', req.user);
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }
    
    // 获取要取消关注的用户ID
    const followingId = parseInt(req.params.id, 10);
    
    // 确保followingId是有效整数
    if (isNaN(followingId) || followingId <= 0) {
      console.error(`无效的用户ID: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: '无效的用户ID'
      });
    }
    
    console.log(`用户[${req.user.id}]尝试取消关注用户[${followingId}]`);
    
    // 查询是否已经关注过该用户
    const existingFollow = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId
      }
    });
    
    // 如果没有关注过，返回成功而不是错误
    if (!existingFollow) {
      console.log(`用户[${req.user.id}]未关注过用户[${followingId}]，无需取消关注`);
      return res.status(200).json({
        success: true,
        message: '未关注过该用户',
        data: { isFollowing: false }
      });
    }
    
    // 删除关注关系
    await existingFollow.destroy();
    
    console.log(`用户[${req.user.id}]成功取消关注用户[${followingId}]`);
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '取消关注成功',
      data: { isFollowing: false }
    });
  } catch (error) {
    console.error('取消关注用户时发生错误:', error);
    console.error('错误堆栈:', error.stack);
    
    // 返回具体错误信息
    let errorMessage = '取消关注失败，请稍后再试';
    let statusCode = 500;
    
    if (error.name === 'SequelizeValidationError') {
      errorMessage = '提供的数据无效';
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取用户的关注列表
 * @route   GET /api/users/:id/following
 * @access  Public
 */
exports.getFollowing = async (req, res, next) => {
  try {
    // 获取路径参数和查询参数
    const userId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // 查询用户是否存在
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 查询用户关注的人
    const { count, rows: follows } = await Follow.findAndCountAll({
      where: {
        followerId: userId
      },
      attributes: ['id', 'followerId', 'followingId', 'remark', 'created_at', 'updated_at'],
      include: [
        {
          model: User,
          as: 'followedUser',
          attributes: ['id', 'nickname', 'username', 'avatar', 'bio']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    
    // 格式化响应数据
    const following = follows.map(follow => {
      const user = follow.followedUser.toJSON();
      return {
        ...user,
        remark: follow.remark,
        followedAt: follow.createdAt
      };
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 如果当前用户已登录，查询是否已关注这些用户
    let isFollowedMap = {};
    if (req.user) {
      const followingIds = following.map(user => user.id);
      
      if (followingIds.length > 0) {
        const userFollows = await Follow.findAll({
          where: {
            followerId: req.user.id,
            followingId: {
              [Op.in]: followingIds
            }
          }
        });
        
        isFollowedMap = userFollows.reduce((map, follow) => {
          map[follow.followingId] = true;
          return map;
        }, {});
      }
      
      // 添加isFollowed字段
      following.forEach(user => {
        user.isFollowed = Boolean(isFollowedMap[user.id]);
      });
    }
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        following,
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
 * @desc    获取用户的粉丝列表
 * @route   GET /api/users/:id/followers
 * @access  Public
 */
exports.getFollowers = async (req, res, next) => {
  try {
    // 获取路径参数和查询参数
    const userId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    // 是否包含已删除的关注记录
    const includeDeleted = req.query.include_deleted === 'true';
    
    console.log(`获取用户[${userId}]的粉丝列表, 页码: ${page}, 每页数量: ${limit}, 包含已取消关注: ${includeDeleted}`);
    
    // 查询用户是否存在
    const user = await User.findByPk(userId);
    
    if (!user) {
      console.log(`用户[${userId}]不存在，无法获取粉丝列表`);
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 查询条件
    const whereCondition = {
      followingId: userId
    };
    
    // 查询选项
    const queryOptions = {
      where: whereCondition,
      attributes: ['id', 'followerId', 'followingId', 'remark', 'created_at', 'updated_at', 'deleted_at'],
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'nickname', 'username', 'avatar', 'bio']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    };
    
    // 如果需要包含已删除的记录
    if (includeDeleted) {
      queryOptions.paranoid = false;
    }
    
    // 查询用户的粉丝
    const { count, rows: follows } = await Follow.findAndCountAll(queryOptions);
    
    console.log(`用户[${userId}]的粉丝数量: ${count}, 当前页数据: ${follows.length}`);
    
    // 格式化响应数据
    const followers = follows.map(follow => {
      const user = follow.follower.toJSON();
      return {
        ...user,
        followedAt: follow.createdAt,
        unfollowedAt: follow.deleted_at, // 添加取消关注时间
        isDeleted: !!follow.deleted_at // 添加是否已取消关注的标志
      };
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 如果当前用户已登录，查询是否已关注这些用户
    let isFollowedMap = {};
    if (req.user) {
      console.log(`检查当前登录用户[${req.user.id}]是否关注了粉丝列表中的用户`);
      
      const followerIds = followers.map(user => user.id);
      console.log(`粉丝ID列表:`, followerIds);
      
      if (followerIds.length > 0) {
        try {
          // 查询当前用户是否关注了这些粉丝
          const userFollows = await Follow.findAll({
            where: {
              followerId: req.user.id,
              followingId: {
                [Op.in]: followerIds
              }
            },
            attributes: ['followerId', 'followingId']
          });
          
          console.log(`找到的关注关系数量: ${userFollows.length}`);
          console.log(`关注关系详情:`, userFollows.map(f => ({ followerId: f.followerId, followingId: f.followingId })));
          
          // 创建一个映射，键是被关注者ID，值是true
          isFollowedMap = userFollows.reduce((map, follow) => {
            map[follow.followingId] = true;
            return map;
          }, {});
          
          console.log('关注映射:', isFollowedMap);
        } catch (error) {
          console.error('查询关注关系时发生错误:', error);
          // 出错时设置为空映射，不影响API正常返回
          isFollowedMap = {};
        }
      }
      
      // 添加isFollowing字段
      followers.forEach(user => {
        // 这里检查当前用户是否关注了这个粉丝
        // isFollowedMap中存储的是当前用户关注的用户ID
        user.isFollowing = Boolean(isFollowedMap[user.id]);
        console.log(`粉丝[${user.id}]的关注状态: ${user.isFollowing}, 映射值: ${isFollowedMap[user.id]}`);
      });
    }
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        followers,
        pagination: {
          page,
          limit,
          total: count,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('获取粉丝列表时发生错误:', error);
    res.status(500).json({
      success: false,
      message: '获取粉丝列表失败，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    检查是否关注用户
 * @route   GET /api/users/:id/follow/status
 * @access  Private
 */
exports.checkFollowStatus = async (req, res, next) => {
  try {
    // 获取要检查的用户ID
    const followingId = req.params.id;
    
    console.log(`用户[${req.user.id}]检查是否已关注用户[${followingId}]`);
    
    // 查询是否已经关注过该用户
    const existingFollow = await Follow.findOne({
      where: {
        followerId: req.user.id,
        followingId
      },
      attributes: ['id', 'followerId', 'followingId', 'remark', 'created_at', 'updated_at']
    });
    
    const isFollowing = Boolean(existingFollow);
    console.log(`用户[${req.user.id}]关注用户[${followingId}]的状态: ${isFollowing}`);
    
    // 返回关注状态
    res.status(200).json({
      success: true,
      data: {
        isFollowing
      }
    });
  } catch (error) {
    console.error('检查关注状态时发生错误:', error);
    res.status(500).json({
      success: false,
      message: '检查关注状态失败，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取互相关注的用户列表
 * @route   GET /api/users/mutual-follows
 * @access  Private
 */
exports.getMutualFollows = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    console.log(`获取用户[${userId}]的互相关注列表`);
    
    // 查询互相关注的用户ID
    // 找出当前用户关注的人，且这些人也关注了当前用户
    const follows = await Follow.findAll({
      where: {
        followerId: userId
      },
      attributes: ['followingId'],
      raw: true
    });
    
    // 提取关注的用户ID
    const followingIds = follows.map(follow => follow.followingId);
    
    console.log(`用户[${userId}]关注了${followingIds.length}人`);
    
    // 如果没有关注任何人，则直接返回空列表
    if (followingIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          userIds: []
        }
      });
    }
    
    // 查询哪些用户也关注了当前用户
    const mutualFollows = await Follow.findAll({
      where: {
        followerId: {
          [Op.in]: followingIds
        },
        followingId: userId
      },
      attributes: ['followerId'],
      raw: true
    });
    
    const mutualUserIds = mutualFollows.map(follow => follow.followerId);
    
    console.log(`用户[${userId}]与${mutualUserIds.length}人互相关注`);
    
    res.status(200).json({
      success: true,
      data: {
        userIds: mutualUserIds
      }
    });
  } catch (error) {
    console.error('获取互相关注用户列表时发生错误:', error);
    res.status(500).json({
      success: false,
      message: '获取互相关注用户列表失败，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};