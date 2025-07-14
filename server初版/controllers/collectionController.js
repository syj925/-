const { Collection, Post, User } = require('../models/associations');
const { Op, Transaction } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @desc    收藏帖子
 * @route   POST /api/posts/:id/collect
 * @access  Private
 */
exports.collectPost = async (req, res, next) => {
  // 创建事务
  const transaction = await sequelize.transaction();
  
  try {
    // 获取帖子ID和收藏夹名称
    const postId = req.params.id;
    const { name } = req.body;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 查询用户是否已经收藏过该帖子
    let existingCollection = await Collection.findOne({
      where: {
        userId: req.user.id,
        postId
      },
      // 包括已删除的记录(软删除)
      paranoid: false,
      transaction
    });
    
    // 如果已经存在收藏记录(包括已软删除的)
    if (existingCollection) {
      // 如果是已删除的记录，则恢复
      if (existingCollection.deletedAt) {
        await existingCollection.restore({ transaction });
        
        // 增加帖子收藏数
        post.collections += 1;
        await post.save({ transaction });
        
        // 提交事务
        await transaction.commit();
        
        // 响应成功信息
        return res.status(200).json({
          success: true,
          message: '收藏成功',
          data: {
            collectionCount: post.collections
          }
        });
      } else {
        // 如果记录未被删除(正常存在)，返回错误
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: '已经收藏过该帖子'
        });
      }
    }
    
    // 创建收藏记录
    await Collection.create({
      userId: req.user.id,
      postId,
      name: name || null
    }, { transaction });
    
    // 增加帖子收藏数
    post.collections += 1;
    await post.save({ transaction });
    
    // 提交事务
    await transaction.commit();
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '收藏成功',
      data: {
        collectionCount: post.collections
      }
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    取消收藏帖子
 * @route   DELETE /api/posts/:id/collect
 * @access  Private
 */
exports.uncollectPost = async (req, res, next) => {
  // 创建事务
  const transaction = await sequelize.transaction();
  
  try {
    // 获取帖子ID
    const postId = req.params.id;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId);
    
    if (!post) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 查询用户是否已经收藏过该帖子
    const existingCollection = await Collection.findOne({
      where: {
        userId: req.user.id,
        postId
      },
      transaction
    });
    
    // 如果没有收藏过，返回错误
    if (!existingCollection) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '未收藏过该帖子'
      });
    }
    
    // 删除收藏记录
    await existingCollection.destroy({ transaction });
    
    // 减少帖子收藏数（确保不会小于0）
    post.collections = Math.max(0, post.collections - 1);
    await post.save({ transaction });
    
    // 提交事务
    await transaction.commit();
    
    // 响应成功信息
    res.status(200).json({
      success: true,
      message: '取消收藏成功',
      data: {
        collectionCount: post.collections
      }
    });
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    next(error);
  }
};

/**
 * @desc    获取用户收藏的帖子列表
 * @route   GET /api/users/:id/collections
 * @access  Private
 */
exports.getCollectedPosts = async (req, res, next) => {
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
    
    // 检查权限（只能查看自己的收藏列表或管理员可查看所有）
    if (userId != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权查看该用户的收藏列表'
      });
    }
    
    // 查询用户收藏的帖子
    const { count, rows: collections } = await Collection.findAndCountAll({
      where: {
        userId
      },
      attributes: ['id', 'userId', 'postId', 'name', 'created_at', 'updated_at'],
      include: [
        {
          model: Post,
          as: 'post',
          where: {
            status: 'published'
          },
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'nickname', 'username', 'avatar']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });
    
    // 格式化响应数据
    const collectedPosts = collections.map(collection => {
      const post = collection.post.toJSON();
      return {
        ...post,
        collectionName: collection.name,
        collectedAt: collection.createdAt
      };
    });
    
    // 计算总页数
    const totalPages = Math.ceil(count / limit);
    
    // 响应数据
    res.status(200).json({
      success: true,
      data: {
        posts: collectedPosts,
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
 * @desc    检查用户是否收藏了帖子
 * @route   GET /api/posts/:id/collect/status
 * @access  Private
 */
exports.checkCollectionStatus = async (req, res, next) => {
  try {
    // 获取帖子ID
    const postId = req.params.id;
    
    // 查询帖子是否存在
    const post = await Post.findByPk(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }
    
    // 检查用户是否已登录
    if (!req.user) {
      return res.status(200).json({
        success: true,
        data: {
          isCollected: false
        }
      });
    }
    
    // 查询用户是否已经收藏过该帖子
    const existingCollection = await Collection.findOne({
      where: {
        userId: req.user.id,
        postId
      }
    });
    
    // 返回收藏状态
    res.status(200).json({
      success: true,
      data: {
        isCollected: !!existingCollection
      }
    });
  } catch (error) {
    next(error);
  }
}; 