const emojiService = require('../services/emoji.service');
const { ResponseUtil } = require('../utils');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../config/logger');

/**
 * 表情控制器
 */
class EmojiController {
  // ==================== 客户端API ====================

  /**
   * 获取初始化数据
   * 根据版本号返回全量或增量更新
   */
  async getInitData(req, res, next) {
    try {
      const { version = 0 } = req.query;
      const userId = req.user?.id || null;

      const result = await emojiService.getInitData(
        parseInt(version, 10),
        userId
      );

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取表情包列表
   */
  async getPacks(req, res, next) {
    try {
      const { type, featured, page = 1, limit = 20, includeEmojis } = req.query;

      const result = await emojiService.getPacks({
        type,
        featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        includeEmojis: includeEmojis === 'true'
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取表情包详情
   */
  async getPackById(req, res, next) {
    try {
      const { packId } = req.params;

      const result = await emojiService.getPackById(packId);

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 搜索表情
   */
  async searchEmojis(req, res, next) {
    try {
      const { keyword, limit = 50 } = req.query;

      const result = await emojiService.searchEmojis(keyword, {
        limit: parseInt(limit, 10)
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取热门表情
   */
  async getHotEmojis(req, res, next) {
    try {
      const { limit = 30 } = req.query;

      const result = await emojiService.getHotEmojis(parseInt(limit, 10));

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 记录表情使用
   */
  async recordUsage(req, res, next) {
    try {
      const userId = req.user.id;
      const { emoji_id } = req.body;

      await emojiService.recordEmojiUsage(userId, emoji_id);

      res.status(StatusCodes.OK).json(ResponseUtil.success({ success: true }));
    } catch (error) {
      next(error);
    }
  }

  // ==================== 用户API ====================

  /**
   * 获取用户个人表情数据（独立于全局版本号）
   * 用于前端单独请求用户数据，不触发全局更新
   */
  async getUserData(req, res, next) {
    try {
      const userId = req.user?.id;

      const result = await emojiService.getUserEmojiData(userId);

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户最近使用的表情
   */
  async getRecentEmojis(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 30 } = req.query;

      const result = await emojiService.getUserRecentEmojis(
        userId,
        parseInt(limit, 10)
      );

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户收藏的表情
   */
  async getFavorites(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await emojiService.getUserFavorites(userId);

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 收藏表情
   */
  async addFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { emoji_id } = req.body;

      await emojiService.addFavorite(userId, emoji_id);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        success: true,
        message: '收藏成功'
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取消收藏表情
   */
  async removeFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { emojiId } = req.params;

      await emojiService.removeFavorite(userId, emojiId);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        success: true,
        message: '取消收藏成功'
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户拥有的表情包
   */
  async getUserPacks(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await emojiService.getUserPacks(userId);

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 添加表情包到用户
   */
  async addPack(req, res, next) {
    try {
      const userId = req.user.id;
      const { pack_id, source = 'download' } = req.body;

      await emojiService.addPackToUser(userId, pack_id, source);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        success: true,
        message: '添加成功'
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 移除用户的表情包
   */
  async removePack(req, res, next) {
    try {
      const userId = req.user.id;
      const { packId } = req.params;

      await emojiService.removePackFromUser(userId, packId);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        success: true,
        message: '移除成功'
      }));
    } catch (error) {
      next(error);
    }
  }

  // ==================== 自定义表情API ====================

  /**
   * 上传自定义表情
   */
  async uploadCustomEmoji(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, url, type = 'static', file_size, width, height } = req.body;

      const result = await emojiService.uploadCustomEmoji(userId, {
        name,
        url,
        type,
        fileSize: file_size,
        width,
        height
      });

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(result, '上传成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取用户的自定义表情列表
   */
  async getUserCustomEmojis(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const result = await emojiService.getUserCustomEmojis(userId, status);

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  // ==================== 管理员API ====================

  /**
   * 创建表情包（管理员）
   */
  async createPack(req, res, next) {
    try {
      const { name, description, cover_url, type = 'official', price = 0 } = req.body;
      const authorId = req.user.id;

      const result = await emojiService.createPack({
        name,
        description,
        coverUrl: cover_url,
        type,
        authorId,
        price
      });

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新表情包（管理员）
   */
  async updatePack(req, res, next) {
    try {
      const { packId } = req.params;
      const { name, description, cover_url, status, sort_order, is_featured, price } = req.body;

      const result = await emojiService.updatePack(packId, {
        name,
        description,
        coverUrl: cover_url,
        status,
        sortOrder: sort_order,
        isFeatured: is_featured,
        price
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除表情包（管理员）
   */
  async deletePack(req, res, next) {
    try {
      const { packId } = req.params;

      await emojiService.deletePack(packId);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        success: true,
        message: '删除成功'
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建表情（管理员）
   */
  async createEmoji(req, res, next) {
    try {
      const {
        pack_id,
        code,
        name,
        keywords,
        url,
        thumbnail_url,
        type = 'static',
        width = 100,
        height = 100,
        file_size
      } = req.body;

      const result = await emojiService.createEmoji({
        packId: pack_id,
        code,
        name,
        keywords,
        url,
        thumbnailUrl: thumbnail_url,
        type,
        width,
        height,
        fileSize: file_size
      });

      res.status(StatusCodes.CREATED).json(ResponseUtil.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新表情（管理员）
   */
  async updateEmoji(req, res, next) {
    try {
      const { emojiId } = req.params;
      const { code, name, keywords, url, thumbnail_url, status, sort_order } = req.body;

      const result = await emojiService.updateEmoji(emojiId, {
        code,
        name,
        keywords,
        url,
        thumbnailUrl: thumbnail_url,
        status,
        sortOrder: sort_order
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除表情（管理员）
   */
  async deleteEmoji(req, res, next) {
    try {
      const { emojiId } = req.params;

      await emojiService.deleteEmoji(emojiId);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        success: true,
        message: '删除成功'
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取待审核表情列表（管理员）
   */
  async getPendingEmojis(req, res, next) {
    try {
      const { status = 'pending', page = 1, limit = 20 } = req.query;

      const result = await emojiService.getPendingEmojis({
        status,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      });

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 审核自定义表情（管理员）
   */
  async reviewEmoji(req, res, next) {
    try {
      const { customEmojiId } = req.params;
      const reviewerId = req.user.id;
      const { approved, reject_reason, pack_id } = req.body;

      const result = await emojiService.reviewCustomEmoji(
        customEmojiId,
        reviewerId,
        {
          approved,
          rejectReason: reject_reason,
          packId: pack_id
        }
      );

      res.status(StatusCodes.OK).json(ResponseUtil.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 同步使用计数（定时任务调用）
   */
  async syncUseCounts(req, res, next) {
    try {
      await emojiService.syncUseCounts();

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        success: true,
        message: '同步完成'
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 清除表情系统缓存（管理员）
   */
  async clearCache(req, res, next) {
    try {
      await emojiService.clearAllCache();

      logger.info(`管理员 ${req.user.id} 清除了表情系统缓存`);

      res.status(StatusCodes.OK).json(ResponseUtil.success({
        success: true,
        message: '表情系统缓存已清除'
      }));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmojiController();
