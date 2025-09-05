const followService = require('../services/follow.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');

/**
 * 关注控制器
 */
class FollowController {
  /**
   * 关注用户
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async followUser(req, res, next) {
    try {
      const followerId = req.user.id;
      const { user_id } = req.body;
      
      const result = await followService.followUser(followerId, user_id);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取消关注
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async unfollowUser(req, res, next) {
    try {
      const followerId = req.user.id;
      const { user_id } = req.params;
      
      const result = await followService.unfollowUser(followerId, user_id);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户的关注列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getFollowings(req, res, next) {
    try {
      const { user_id } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await followService.getFollowings(
        user_id,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前用户的关注列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getMyFollowings(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await followService.getFollowings(
        userId,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户的粉丝列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getFollowers(req, res, next) {
    try {
      const { user_id } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await followService.getFollowers(
        user_id,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前用户的粉丝列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getMyFollowers(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await followService.getFollowers(
        userId,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户的关注数量和粉丝数量
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getFollowCounts(req, res, next) {
    try {
      const { user_id } = req.params;
      
      const followingCount = await followService.getFollowingCount(user_id);
      const followerCount = await followService.getFollowerCount(user_id);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success({
        following_count: followingCount,
        follower_count: followerCount
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 检查当前用户是否已关注指定用户
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async isFollowing(req, res, next) {
    try {
      const followerId = req.user ? req.user.id : null;
      const { user_id } = req.params;
      
      const result = await followService.isFollowing(followerId, user_id);
      
      res.status(StatusCodes.OK).json(ResponseUtil.success({ following: result }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取两个用户的共同关注列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getCommonFollowings(req, res, next) {
    try {
      const { user_id1, user_id2 } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      
      const result = await followService.getCommonFollowings(
        user_id1,
        user_id2,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量检查关注状态
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async batchCheckFollowStatus(req, res, next) {
    try {
      const followerId = req.user.id;
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds)) {
        return res.status(StatusCodes.BAD_REQUEST).json(
          ResponseUtil.error('userIds必须是数组')
        );
      }

      const result = await followService.batchCheckFollowStatus(followerId, userIds);

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 检查两个用户是否互相关注
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async checkMutualFollow(req, res, next) {
    try {
      const { user_id1, user_id2 } = req.params;

      const result = await followService.checkMutualFollow(user_id1, user_id2);

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户的互相关注列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getMutualFollowings(req, res, next) {
    try {
      const { user_id } = req.params;
      const { page = 1, pageSize = 20 } = req.query;

      const result = await followService.getMutualFollowings(
        user_id,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );

      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前用户的互相关注列表
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getMyMutualFollowings(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 20 } = req.query;

      const result = await followService.getMutualFollowings(
        userId,
        parseInt(page, 10),
        parseInt(pageSize, 10)
      );

      res.status(StatusCodes.OK).json(ResponseUtil.page(
        result.list,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      ));
    } catch (error) {
      next(error);
    }
  }
  /**
   * 获取用户的关注和粉丝数据（合并API）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getUserFollowData(req, res, next) {
    try {
      const { user_id } = req.params;
      const { 
        followingPage = 1, 
        followingPageSize = 20,
        followersPage = 1,
        followersPageSize = 20
      } = req.query;
      
      const result = await followService.getUserFollowData(
        user_id,
        {
          followingPage: parseInt(followingPage, 10),
          followingPageSize: parseInt(followingPageSize, 10),
          followersPage: parseInt(followersPage, 10),
          followersPageSize: parseInt(followersPageSize, 10)
        }
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前用户的关注和粉丝数据（合并API）
   * @param {Object} req 请求对象
   * @param {Object} res 响应对象
   * @param {Function} next 下一个中间件
   * @returns {Promise<void>}
   */
  async getMyFollowData(req, res, next) {
    try {
      const userId = req.user.id;
      const { 
        followingPage = 1, 
        followingPageSize = 20,
        followersPage = 1,
        followersPageSize = 20
      } = req.query;
      
      const result = await followService.getUserFollowData(
        userId,
        {
          followingPage: parseInt(followingPage, 10),
          followingPageSize: parseInt(followingPageSize, 10),
          followersPage: parseInt(followersPage, 10),
          followersPageSize: parseInt(followersPageSize, 10)
        }
      );
      
      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FollowController();