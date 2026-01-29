/**
 * 表情核心业务服务
 * 处理表情包、表情的CRUD操作、搜索、审核等核心逻辑
 */
const { Op } = require('sequelize');
const db = require('../models');
const emojiCacheService = require('./emoji-cache.service');
const emojiConfig = require('../../config/emoji');
const logger = require('../../config/logger');
const { StatusCodes } = require('http-status-codes');
const { ErrorMiddleware } = require('../middlewares');
const webSocketService = require('../utils/websocket');

const { 
  EmojiPack, 
  Emoji, 
  UserCustomEmoji, 
  UserEmojiPack, 
  EmojiFavorite, 
  EmojiUsageHistory,
  EmojiVersion,
  User
} = db;

class EmojiService {
  // ==================== 初始化相关 ====================

  /**
   * 获取客户端初始化数据
   * 检查版本并返回相应的表情数据
   * @param {number} clientVersion 客户端当前版本
   * @param {string} userId 用户ID（可选）
   * @returns {Promise<Object>}
   */
  async getInitData(clientVersion = 0, userId = null) {
    const serverVersion = await emojiCacheService.getVersion();
    
    // 版本一致，无需更新
    if (clientVersion === serverVersion) {
      return {
        needUpdate: false,
        version: serverVersion
      };
    }

    // 客户端版本大于服务端版本（版本号被重置），强制全量更新
    if (clientVersion > serverVersion) {
      logger.info('客户端版本大于服务端，强制全量更新', { clientVersion, serverVersion });
      return await this.getFullData(userId);
    }

    // 版本差距过大，全量更新
    const versionDiff = serverVersion - clientVersion;
    if (clientVersion === 0 || versionDiff > emojiConfig.version.incrementalThreshold) {
      return await this.getFullData(userId);
    }

    // 增量更新
    return await this.getIncrementalData(clientVersion, serverVersion, userId);
  }

  /**
   * 获取全量表情数据
   * @param {string} userId 用户ID（可选）
   * @returns {Promise<Object>}
   */
  async getFullData(userId = null) {
    // 尝试从缓存获取
    let packs = await emojiCacheService.getPacksCache();
    
    logger.info('从缓存获取表情包:', { cachedPacks: packs ? packs.length : 0 });
    
    // 检查缓存是否有效：缓存不存在或为空数组时重新查询
    if (!packs || packs.length === 0) {
      // 获取所有可用表情包及其表情
      packs = await EmojiPack.findAll({
        where: { 
          status: 'active',
          type: { [Op.in]: ['system', 'official'] }
        },
        include: [{
          model: Emoji,
          as: 'emojis',
          where: { status: 'active' },
          required: false,
          order: [['sort_order', 'ASC']]
        }],
        order: [
          ['type', 'ASC'],
          ['sort_order', 'ASC']
        ]
      });

      logger.info('数据库查询表情包:', { dbPacks: packs.length });

      // 只缓存非空数据
      if (packs.length > 0) {
        await emojiCacheService.setPacksCache(packs);
      }
    }

    // 构建表情映射表
    const emojiMap = await this.buildEmojiMap();
    
    const version = await emojiCacheService.getVersion();

    // 只返回全局数据，用户数据通过 /user-data 单独请求
    return {
      needUpdate: true,
      updateType: 'full',
      version,
      packs: packs.map(pack => this.formatPackData(pack)),
      emojiMap
    };
  }

  /**
   * 获取增量更新数据
   * @param {number} fromVersion 起始版本
   * @param {number} toVersion 目标版本
   * @param {string} userId 用户ID（可选）
   * @returns {Promise<Object>}
   */
  async getIncrementalData(fromVersion, toVersion, userId = null) {
    // 获取版本间的变更记录
    const versions = await EmojiVersion.findAll({
      where: {
        version: { [Op.gt]: fromVersion, [Op.lte]: toVersion }
      },
      order: [['version', 'ASC']]
    });

    // 合并所有变更
    const changes = {
      added: [],
      updated: [],
      deleted: []
    };

    for (const v of versions) {
      const vChanges = v.change_data || {};
      if (vChanges.added) changes.added.push(...vChanges.added);
      if (vChanges.updated) changes.updated.push(...vChanges.updated);
      if (vChanges.deleted) changes.deleted.push(...vChanges.deleted);
    }

    // 去重（保留最新状态）
    const addedSet = new Set(changes.added);
    const deletedSet = new Set(changes.deleted);
    
    // 删除后又添加的，只保留添加
    for (const id of addedSet) {
      deletedSet.delete(id);
    }

    // 获取需要更新的表情详情
    const emojiIds = [...addedSet, ...new Set(changes.updated)];
    const emojis = emojiIds.length > 0 ? await Emoji.findAll({
      where: { id: { [Op.in]: emojiIds }, status: 'active' },
      include: [{
        model: EmojiPack,
        as: 'pack',
        attributes: ['id', 'name', 'type']
      }]
    }) : [];

    return {
      needUpdate: true,
      updateType: 'incremental',
      version: toVersion,
      changes: {
        added: emojis.filter(e => addedSet.has(e.id)).map(e => this.formatEmojiData(e)),
        updated: emojis.filter(e => !addedSet.has(e.id)).map(e => this.formatEmojiData(e)),
        deleted: [...deletedSet]
      }
    };
  }

  // ==================== 表情包管理 ====================

  /**
   * 获取表情包列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>}
   */
  async getPacks(options = {}) {
    const { 
      type, 
      status = 'active', 
      featured, 
      page = 1, 
      limit = 20,
      includeEmojis = false
    } = options;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (featured !== undefined) where.is_featured = featured;

    const queryOptions = {
      where,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    };

    if (includeEmojis) {
      queryOptions.include = [{
        model: Emoji,
        as: 'emojis',
        where: { status: 'active' },
        required: false,
        order: [['sort_order', 'ASC']]
      }];
    }

    const { count, rows } = await EmojiPack.findAndCountAll(queryOptions);

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows.map(pack => this.formatPackData(pack))
    };
  }

  /**
   * 获取单个表情包详情
   * @param {string} packId 表情包ID
   * @returns {Promise<Object>}
   */
  async getPackById(packId) {
    const pack = await EmojiPack.findByPk(packId, {
      include: [{
        model: Emoji,
        as: 'emojis',
        where: { status: 'active' },
        required: false,
        order: [['sort_order', 'ASC']]
      }, {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }]
    });

    if (!pack) {
      throw ErrorMiddleware.createError(
        '表情包不存在',
        StatusCodes.NOT_FOUND
      );
    }

    return this.formatPackData(pack);
  }

  /**
   * 创建表情包
   * @param {Object} data 表情包数据
   * @returns {Promise<Object>}
   */
  async createPack(data) {
    const { name, description, coverUrl, type = 'official', authorId, price = 0 } = data;

    const pack = await EmojiPack.create({
      name,
      description,
      cover_url: coverUrl,
      type,
      author_id: authorId,
      price,
      status: type === 'user' ? 'pending' : 'active'
    });

    // 清除缓存并更新版本
    await emojiCacheService.clearPackCache(pack.id);
    await emojiCacheService.incrementVersion();

    logger.info(`创建表情包: ${pack.id} - ${name}`);

    return this.formatPackData(pack);
  }

  /**
   * 更新表情包
   * @param {string} packId 表情包ID
   * @param {Object} data 更新数据
   * @returns {Promise<Object>}
   */
  async updatePack(packId, data) {
    const pack = await EmojiPack.findByPk(packId);
    if (!pack) {
      throw ErrorMiddleware.createError(
        '表情包不存在',
        StatusCodes.NOT_FOUND
      );
    }

    const updateFields = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.coverUrl !== undefined) updateFields.cover_url = data.coverUrl;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.sortOrder !== undefined) updateFields.sort_order = data.sortOrder;
    if (data.isFeatured !== undefined) updateFields.is_featured = data.isFeatured;
    if (data.price !== undefined) updateFields.price = data.price;

    await pack.update(updateFields);

    // 清除缓存并更新版本
    await emojiCacheService.clearPackCache(packId);
    await emojiCacheService.incrementVersion();

    logger.info(`更新表情包: ${packId}`);

    return this.formatPackData(pack);
  }

  /**
   * 删除表情包（软删除）
   * @param {string} packId 表情包ID
   * @returns {Promise<boolean>}
   */
  async deletePack(packId) {
    const pack = await EmojiPack.findByPk(packId);
    if (!pack) {
      throw ErrorMiddleware.createError(
        '表情包不存在',
        StatusCodes.NOT_FOUND
      );
    }

    // 同时软删除包内的所有表情
    await Emoji.destroy({ where: { pack_id: packId } });
    await pack.destroy();

    // 记录版本变更
    await this.recordVersionChange('delete', { packId });

    // 清除缓存并更新版本
    await emojiCacheService.clearPackCache(packId);

    logger.info(`删除表情包: ${packId}`);

    return true;
  }

  // ==================== 表情管理 ====================

  /**
   * 创建表情
   * @param {Object} data 表情数据
   * @returns {Promise<Object>}
   */
  async createEmoji(data) {
    const { 
      packId, 
      code, 
      name, 
      keywords, 
      url, 
      thumbnailUrl,
      type = 'static',
      width = 100,
      height = 100,
      fileSize
    } = data;

    // 验证表情包存在
    const pack = await EmojiPack.findByPk(packId);
    if (!pack) {
      throw ErrorMiddleware.createError(
        '表情包不存在',
        StatusCodes.NOT_FOUND
      );
    }

    // 验证code格式
    if (!emojiConfig.code.pattern.test(code)) {
      throw ErrorMiddleware.createError(
        '表情代码格式不正确，应为 [表情名] 格式',
        StatusCodes.BAD_REQUEST
      );
    }

    // 检查code是否已存在
    const existingEmoji = await Emoji.findOne({ where: { code } });
    if (existingEmoji) {
      throw ErrorMiddleware.createError(
        '表情代码已存在',
        StatusCodes.CONFLICT
      );
    }

    const emoji = await Emoji.create({
      pack_id: packId,
      code,
      name,
      keywords,
      url,
      thumbnail_url: thumbnailUrl,
      type,
      width,
      height,
      file_size: fileSize,
      status: 'active'
    });

    // 记录版本变更
    await this.recordVersionChange('add', { emojiId: emoji.id });

    // 清除缓存
    await emojiCacheService.clearPackCache(packId);

    logger.info(`创建表情: ${emoji.id} - ${code}`);

    return this.formatEmojiData(emoji);
  }

  /**
   * 更新表情
   * @param {string} emojiId 表情ID
   * @param {Object} data 更新数据
   * @returns {Promise<Object>}
   */
  async updateEmoji(emojiId, data) {
    const emoji = await Emoji.findByPk(emojiId);
    if (!emoji) {
      throw ErrorMiddleware.createError(
        '表情不存在',
        StatusCodes.NOT_FOUND
      );
    }

    const updateFields = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.keywords !== undefined) updateFields.keywords = data.keywords;
    if (data.url !== undefined) updateFields.url = data.url;
    if (data.thumbnailUrl !== undefined) updateFields.thumbnail_url = data.thumbnailUrl;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.sortOrder !== undefined) updateFields.sort_order = data.sortOrder;

    // 更新code需要检查唯一性
    if (data.code !== undefined && data.code !== emoji.code) {
      if (!emojiConfig.code.pattern.test(data.code)) {
        throw ErrorMiddleware.createError(
          '表情代码格式不正确',
          StatusCodes.BAD_REQUEST
        );
      }
      const existingEmoji = await Emoji.findOne({ where: { code: data.code } });
      if (existingEmoji) {
        throw ErrorMiddleware.createError(
          '表情代码已存在',
          StatusCodes.CONFLICT
        );
      }
      updateFields.code = data.code;
    }

    await emoji.update(updateFields);

    // 记录版本变更
    await this.recordVersionChange('update', { emojiId });

    // 清除缓存
    await emojiCacheService.clearPackCache(emoji.pack_id);

    logger.info(`更新表情: ${emojiId}`);

    return this.formatEmojiData(emoji);
  }

  /**
   * 删除表情（软删除）
   * @param {string} emojiId 表情ID
   * @returns {Promise<boolean>}
   */
  async deleteEmoji(emojiId) {
    const emoji = await Emoji.findByPk(emojiId);
    if (!emoji) {
      throw ErrorMiddleware.createError(
        '表情不存在',
        StatusCodes.NOT_FOUND
      );
    }

    const packId = emoji.pack_id;
    await emoji.destroy();

    // 记录版本变更
    await this.recordVersionChange('delete', { emojiId });

    // 清除缓存
    await emojiCacheService.clearPackCache(packId);

    logger.info(`删除表情: ${emojiId}`);

    return true;
  }

  // ==================== 搜索功能 ====================

  /**
   * 搜索表情
   * @param {string} keyword 关键字
   * @param {Object} options 选项
   * @returns {Promise<Array>}
   */
  async searchEmojis(keyword, options = {}) {
    const { limit = 50 } = options;

    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const searchKey = keyword.trim().toLowerCase();

    // 尝试从缓存获取
    const cached = await emojiCacheService.getSearchCache(searchKey);
    if (cached) {
      return cached;
    }

    // 搜索数据库
    const emojis = await Emoji.findAll({
      where: {
        status: 'active',
        [Op.or]: [
          { name: { [Op.like]: `%${searchKey}%` } },
          { code: { [Op.like]: `%${searchKey}%` } },
          { keywords: { [Op.like]: `%${searchKey}%` } }
        ]
      },
      include: [{
        model: EmojiPack,
        as: 'pack',
        where: { status: 'active' },
        attributes: ['id', 'name', 'type']
      }],
      order: [['use_count', 'DESC']],
      limit
    });

    const results = emojis.map(e => this.formatEmojiData(e));

    // 缓存结果
    await emojiCacheService.setSearchCache(searchKey, results);

    return results;
  }

  // ==================== 热门表情 ====================

  /**
   * 获取热门表情
   * @param {number} limit 数量限制
   * @returns {Promise<Array>}
   */
  async getHotEmojis(limit = 30) {
    // 尝试从缓存获取
    const cached = await emojiCacheService.getHotCache();
    if (cached) {
      return cached.slice(0, limit);
    }

    // 查询热门表情
    const emojis = await Emoji.findAll({
      where: { status: 'active' },
      include: [{
        model: EmojiPack,
        as: 'pack',
        where: { status: 'active' },
        attributes: ['id', 'name', 'type']
      }],
      order: [['use_count', 'DESC']],
      limit: 100 // 缓存更多
    });

    const results = emojis.map(e => this.formatEmojiData(e));

    // 缓存结果
    await emojiCacheService.setHotCache(results);

    return results.slice(0, limit);
  }

  // ==================== 用户相关 ====================

  /**
   * 记录表情使用
   * @param {string} userId 用户ID
   * @param {string} emojiId 表情ID
   */
  async recordEmojiUsage(userId, emojiId) {
    try {
      // 更新Redis缓存中的最近使用
      await emojiCacheService.addRecentEmoji(userId, emojiId);
      
      // 增加使用计数（批量更新到DB）
      await emojiCacheService.incrementUseCount(emojiId);

      // 异步更新使用历史
      this.updateUsageHistory(userId, emojiId).catch(err => {
        logger.warn('更新表情使用历史失败:', err.message);
      });
    } catch (error) {
      logger.warn('记录表情使用失败:', error.message);
    }
  }

  /**
   * 更新用户使用历史（DB）
   * @param {string} userId 用户ID
   * @param {string} emojiId 表情ID
   */
  async updateUsageHistory(userId, emojiId) {
    // 先验证表情是否存在，避免外键约束错误
    const emojiExists = await Emoji.findOne({
      where: { id: emojiId, status: 'active' },
      attributes: ['id']
    });

    if (!emojiExists) {
      logger.debug(`表情 ${emojiId} 不存在，跳过使用历史记录`);
      return;
    }

    const [history, created] = await EmojiUsageHistory.findOrCreate({
      where: { user_id: userId, emoji_id: emojiId },
      defaults: { usage_count: 1, last_used_at: new Date() }
    });

    if (!created) {
      await history.update({
        usage_count: history.usage_count + 1,
        last_used_at: new Date()
      });
    }
  }

  /**
   * 获取用户最近使用的表情
   * @param {string} userId 用户ID
   * @param {number} limit 数量限制
   * @returns {Promise<Array>}
   */
  async getUserRecentEmojis(userId, limit = 30) {
    // 从Redis获取最近使用的表情ID
    const emojiIds = await emojiCacheService.getRecentEmojiIds(userId);
    
    if (emojiIds.length === 0) {
      // 如果Redis中没有，从DB获取
      const histories = await EmojiUsageHistory.findAll({
        where: { user_id: userId },
        order: [['last_used_at', 'DESC']],
        limit,
        attributes: ['emoji_id']
      });
      
      if (histories.length === 0) return [];
      
      const dbEmojiIds = histories.map(h => h.emoji_id);
      const emojis = await Emoji.findAll({
        where: { id: { [Op.in]: dbEmojiIds }, status: 'active' }
      });
      
      // 按原顺序返回
      const emojiMap = new Map(emojis.map(e => [e.id, e]));
      return dbEmojiIds
        .filter(id => emojiMap.has(id))
        .map(id => this.formatEmojiData(emojiMap.get(id)));
    }

    // 从Redis ID获取表情详情
    const emojis = await Emoji.findAll({
      where: { id: { [Op.in]: emojiIds.slice(0, limit) }, status: 'active' }
    });

    // 按Redis中的顺序返回
    const emojiMap = new Map(emojis.map(e => [e.id, e]));
    return emojiIds
      .filter(id => emojiMap.has(id))
      .slice(0, limit)
      .map(id => this.formatEmojiData(emojiMap.get(id)));
  }

  /**
   * 获取用户收藏的表情
   * @param {string} userId 用户ID
   * @returns {Promise<Array>}
   */
  async getUserFavorites(userId) {
    const favorites = await EmojiFavorite.findAll({
      where: { user_id: userId },
      include: [{
        model: Emoji,
        as: 'emoji',
        where: { status: 'active' },
        required: true
      }],
      order: [['created_at', 'DESC']]
    });

    return favorites.map(f => this.formatEmojiData(f.emoji));
  }

  /**
   * 收藏表情
   * @param {string} userId 用户ID
   * @param {string} emojiId 表情ID
   * @returns {Promise<boolean>}
   */
  async addFavorite(userId, emojiId) {
    const emoji = await Emoji.findByPk(emojiId);
    if (!emoji || emoji.status !== 'active') {
      throw ErrorMiddleware.createError(
        '表情不存在或已下架',
        StatusCodes.NOT_FOUND
      );
    }

    await EmojiFavorite.findOrCreate({
      where: { user_id: userId, emoji_id: emojiId }
    });

    logger.info(`用户 ${userId} 收藏表情 ${emojiId}`);
    return true;
  }

  /**
   * 取消收藏表情
   * @param {string} userId 用户ID
   * @param {string} emojiId 表情ID
   * @returns {Promise<boolean>}
   */
  async removeFavorite(userId, emojiId) {
    await EmojiFavorite.destroy({
      where: { user_id: userId, emoji_id: emojiId }
    });

    logger.info(`用户 ${userId} 取消收藏表情 ${emojiId}`);
    return true;
  }

  /**
   * 获取用户拥有的表情包
   * @param {string} userId 用户ID
   * @returns {Promise<Array>}
   */
  async getUserPacks(userId) {
    const userPacks = await UserEmojiPack.findAll({
      where: { user_id: userId },
      include: [{
        model: EmojiPack,
        as: 'pack',
        where: { status: 'active' },
        required: true,
        include: [{
          model: Emoji,
          as: 'emojis',
          where: { status: 'active' },
          required: false
        }]
      }],
      order: [['sort_order', 'ASC']]
    });

    return userPacks.map(up => ({
      ...this.formatPackData(up.pack),
      source: up.source,
      userSortOrder: up.sort_order
    }));
  }

  /**
   * 添加表情包到用户
   * @param {string} userId 用户ID
   * @param {string} packId 表情包ID
   * @param {string} source 来源
   * @returns {Promise<boolean>}
   */
  async addPackToUser(userId, packId, source = 'download') {
    const pack = await EmojiPack.findByPk(packId);
    if (!pack || pack.status !== 'active') {
      throw ErrorMiddleware.createError(
        '表情包不存在或已下架',
        StatusCodes.NOT_FOUND
      );
    }

    await UserEmojiPack.findOrCreate({
      where: { user_id: userId, pack_id: packId },
      defaults: { source }
    });

    // 增加下载计数
    await pack.increment('download_count');

    logger.info(`用户 ${userId} 添加表情包 ${packId}`);
    return true;
  }

  /**
   * 从用户移除表情包
   * @param {string} userId 用户ID
   * @param {string} packId 表情包ID
   * @returns {Promise<boolean>}
   */
  async removePackFromUser(userId, packId) {
    await UserEmojiPack.destroy({
      where: { user_id: userId, pack_id: packId }
    });

    logger.info(`用户 ${userId} 移除表情包 ${packId}`);
    return true;
  }

  // ==================== 自定义表情审核 ====================

  /**
   * 上传自定义表情
   * @param {string} userId 用户ID
   * @param {Object} data 表情数据
   * @returns {Promise<Object>}
   */
  async uploadCustomEmoji(userId, data) {
    const { name, url, type = 'static', fileSize, width, height } = data;

    // 检查每日上传限制
    const { allowed, count } = await emojiCacheService.checkUploadLimit(
      userId, 
      emojiConfig.upload.dailyLimit
    );

    if (!allowed) {
      throw ErrorMiddleware.createError(
        `今日上传已达上限（${emojiConfig.upload.dailyLimit}张），请明天再试`,
        StatusCodes.TOO_MANY_REQUESTS
      );
    }

    const customEmoji = await UserCustomEmoji.create({
      user_id: userId,
      name,
      url,
      type,
      file_size: fileSize,
      width,
      height,
      status: 'pending'
    });

    logger.info(`用户 ${userId} 上传自定义表情: ${customEmoji.id}`);

    return {
      id: customEmoji.id,
      name: customEmoji.name,
      url: customEmoji.url,
      type: customEmoji.type,
      status: customEmoji.status,
      todayCount: count,
      dailyLimit: emojiConfig.upload.dailyLimit
    };
  }

  /**
   * 获取待审核表情列表（管理员）
   * @param {Object} options 查询选项
   * @returns {Promise<Object>}
   */
  async getPendingEmojis(options = {}) {
    const { status = 'pending', page = 1, limit = 20 } = options;

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await UserCustomEmoji.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows.map(item => ({
        id: item.id,
        name: item.name,
        url: item.url,
        type: item.type,
        fileSize: item.file_size,
        width: item.width,
        height: item.height,
        status: item.status,
        uploader: item.uploader ? {
          id: item.uploader.id,
          username: item.uploader.username,
          nickname: item.uploader.nickname,
          avatar: item.uploader.avatar
        } : null,
        createdAt: item.created_at
      }))
    };
  }

  /**
   * 审核自定义表情
   * @param {string} customEmojiId 自定义表情ID
   * @param {string} reviewerId 审核员ID
   * @param {Object} data 审核数据
   * @returns {Promise<Object>}
   */
  async reviewCustomEmoji(customEmojiId, reviewerId, data) {
    const { approved, rejectReason, packId } = data;

    const customEmoji = await UserCustomEmoji.findByPk(customEmojiId, {
      include: [{ model: User, as: 'uploader' }]
    });

    if (!customEmoji) {
      throw ErrorMiddleware.createError(
        '自定义表情不存在',
        StatusCodes.NOT_FOUND
      );
    }

    if (customEmoji.status !== 'pending') {
      throw ErrorMiddleware.createError(
        '该表情已被审核',
        StatusCodes.BAD_REQUEST
      );
    }

    if (approved) {
      // 通过审核 - 创建正式表情
      const username = customEmoji.uploader?.username || 'user';
      const emojiCode = emojiConfig.code.userFormat(username, customEmoji.name);

      // 检查code是否已存在
      let finalCode = emojiCode;
      let counter = 1;
      while (await Emoji.findOne({ where: { code: finalCode } })) {
        finalCode = `[${username}_${customEmoji.name}_${counter}]`;
        counter++;
      }

      // 确定表情包（使用指定的或用户自定义包）
      let targetPackId = packId;
      if (!targetPackId) {
        // 查找或创建用户自定义表情包
        let userPack = await EmojiPack.findOne({
          where: { type: 'user', author_id: customEmoji.user_id }
        });
        
        if (!userPack) {
          const nickname = customEmoji.uploader?.nickname || username;
          userPack = await EmojiPack.create({
            name: `${nickname}的表情`,
            type: 'user',
            author_id: customEmoji.user_id,
            status: 'active'
          });
        }
        targetPackId = userPack.id;
      }

      // 创建正式表情
      const emoji = await Emoji.create({
        pack_id: targetPackId,
        code: finalCode,
        name: customEmoji.name,
        url: customEmoji.url,
        type: customEmoji.type,
        width: customEmoji.width || 100,
        height: customEmoji.height || 100,
        file_size: customEmoji.file_size,
        status: 'active'
      });

      // 更新自定义表情状态
      await customEmoji.update({
        status: 'approved',
        reviewer_id: reviewerId,
        reviewed_at: new Date(),
        emoji_id: emoji.id
      });

      // 记录版本变更
      await this.recordVersionChange('add', { emojiId: emoji.id });

      // 清除缓存
      await emojiCacheService.clearPackCache(targetPackId);

      logger.info(`审核通过自定义表情: ${customEmojiId} -> ${emoji.id}`);

      // 通过WebSocket通知用户表情已审核通过
      webSocketService.sendToUser(customEmoji.user_id, {
        type: 'emoji_approved',
        data: {
          emojiId: emoji.id,
          name: emoji.name,
          url: emoji.url,
          code: emoji.code,
          message: `您的表情"${emoji.name}"已审核通过，已自动添加到您的收藏中`
        }
      });

      return {
        success: true,
        message: '审核通过',
        emoji: this.formatEmojiData(emoji)
      };
    } else {
      // 拒绝审核
      await customEmoji.update({
        status: 'rejected',
        reject_reason: rejectReason,
        reviewer_id: reviewerId,
        reviewed_at: new Date()
      });

      logger.info(`审核拒绝自定义表情: ${customEmojiId}, 原因: ${rejectReason}`);

      // 通过WebSocket通知用户表情被拒绝
      webSocketService.sendToUser(customEmoji.user_id, {
        type: 'emoji_rejected',
        data: {
          name: customEmoji.name,
          reason: rejectReason,
          message: `您的表情"${customEmoji.name}"未通过审核，原因：${rejectReason || '不符合规范'}`
        }
      });

      return {
        success: true,
        message: '已拒绝',
        rejectReason
      };
    }
  }

  /**
   * 获取用户的自定义表情
   * @param {string} userId 用户ID
   * @param {string} status 状态筛选
   * @returns {Promise<Array>}
   */
  async getUserCustomEmojis(userId, status = null) {
    const where = { user_id: userId };
    if (status) where.status = status;

    const emojis = await UserCustomEmoji.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    return emojis.map(item => ({
      id: item.id,
      name: item.name,
      url: item.url,
      type: item.type,
      status: item.status,
      rejectReason: item.reject_reason,
      emojiId: item.emoji_id,
      createdAt: item.created_at
    }));
  }

  // ==================== 版本控制 ====================

  /**
   * 记录版本变更
   * @param {string} changeType 变更类型
   * @param {Object} data 变更数据
   */
  async recordVersionChange(changeType, data) {
    try {
      const newVersion = await emojiCacheService.incrementVersion();
      
      const changes = {};
      if (changeType === 'add' && data.emojiId) {
        changes.added = [data.emojiId];
      } else if (changeType === 'update' && data.emojiId) {
        changes.updated = [data.emojiId];
      } else if (changeType === 'delete') {
        changes.deleted = data.emojiId ? [data.emojiId] : [];
        if (data.packId) {
          // 获取包内所有表情ID
          const emojis = await Emoji.findAll({
            where: { pack_id: data.packId },
            attributes: ['id'],
            paranoid: false
          });
          changes.deleted = emojis.map(e => e.id);
        }
      }

      await EmojiVersion.create({
        version: newVersion,
        change_type: changeType,
        change_data: changes,
        description: `${changeType} operation`
      });
    } catch (error) {
      logger.error('记录版本变更失败:', error.message);
    }
  }

  /**
   * 同步使用计数到数据库
   * 定时任务调用
   */
  async syncUseCounts() {
    try {
      const counts = await emojiCacheService.getAllUseCounts();
      const emojiIds = Object.keys(counts);

      if (emojiIds.length === 0) return;

      // 批量更新
      for (const emojiId of emojiIds) {
        const count = parseInt(counts[emojiId]) || 0;
        if (count > 0) {
          await Emoji.increment('use_count', {
            by: count,
            where: { id: emojiId }
          });
        }
      }

      // 清除已同步的计数
      await emojiCacheService.clearUseCounts();

      logger.info(`同步表情使用计数: ${emojiIds.length} 条`);
    } catch (error) {
      logger.error('同步使用计数失败:', error.message);
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 构建表情映射表
   * @returns {Promise<Object>}
   */
  async buildEmojiMap() {
    // 尝试从缓存获取
    let emojiMap = await emojiCacheService.getEmojiMapCache();
    
    // 检查缓存是否有效：缓存不存在或为空对象时重新查询
    if (emojiMap && Object.keys(emojiMap).length > 0) {
      return emojiMap;
    }

    // 从数据库构建
    const emojis = await Emoji.findAll({
      where: { status: 'active' },
      attributes: ['id', 'code', 'url', 'thumbnail_url', 'type', 'width', 'height']
    });

    emojiMap = {};
    for (const emoji of emojis) {
      emojiMap[emoji.code] = {
        id: emoji.id,
        url: emoji.url,
        thumbnailUrl: emoji.thumbnail_url,
        type: emoji.type,
        width: emoji.width,
        height: emoji.height
      };
    }

    // 只缓存非空数据
    if (Object.keys(emojiMap).length > 0) {
      await emojiCacheService.setEmojiMapCache(emojiMap);
    }

    return emojiMap;
  }

  /**
   * 格式化表情包数据
   * @param {Object} pack 表情包对象
   * @returns {Object}
   */
  formatPackData(pack) {
    if (!pack) return null;

    const data = {
      id: pack.id,
      name: pack.name,
      description: pack.description,
      coverUrl: pack.cover_url,
      type: pack.type,
      price: parseFloat(pack.price) || 0,
      isFeatured: pack.is_featured,
      downloadCount: pack.download_count,
      status: pack.status,
      sortOrder: pack.sort_order,
      version: pack.version,
      createdAt: pack.created_at
    };

    if (pack.author) {
      data.author = {
        id: pack.author.id,
        username: pack.author.username,
        nickname: pack.author.nickname,
        avatar: pack.author.avatar
      };
    }

    if (pack.emojis) {
      data.emojis = pack.emojis.map(e => this.formatEmojiData(e));
      data.emojiCount = pack.emojis.length;
    }

    return data;
  }

  /**
   * 格式化表情数据
   * @param {Object} emoji 表情对象
   * @returns {Object}
   */
  formatEmojiData(emoji) {
    if (!emoji) return null;

    const data = {
      id: emoji.id,
      code: emoji.code,
      name: emoji.name,
      keywords: emoji.keywords,
      url: emoji.url,
      thumbnailUrl: emoji.thumbnail_url,
      type: emoji.type,
      width: emoji.width,
      height: emoji.height,
      useCount: emoji.use_count,
      sortOrder: emoji.sort_order
    };

    if (emoji.pack) {
      data.pack = {
        id: emoji.pack.id,
        name: emoji.pack.name,
        type: emoji.pack.type
      };
    }

    return data;
  }

  // ==================== 用户数据独立API ====================

  /**
   * 获取用户个人表情数据（独立于全局版本号）
   * 包括：收藏、最近使用、自定义表情
   * @param {string} userId 用户ID
   * @returns {Promise<Object>}
   */
  async getUserEmojiData(userId) {
    if (!userId) {
      return {
        favorites: [],
        recent: [],
        customEmojis: [],
        userPacks: []
      };
    }

    // 并行获取所有用户数据
    const [favorites, recent, customEmojis, userPacks] = await Promise.all([
      this.getUserFavorites(userId),
      this.getUserRecentEmojis(userId),
      this.getUserApprovedCustomEmojis(userId),
      this.getUserPacks(userId)
    ]);

    return {
      favorites,
      recent,
      customEmojis,
      userPacks
    };
  }

  /**
   * 获取用户已审核通过的自定义表情
   * @param {string} userId 用户ID
   * @returns {Promise<Array>}
   */
  async getUserApprovedCustomEmojis(userId) {
    const customEmojis = await UserCustomEmoji.findAll({
      where: {
        user_id: userId,
        status: 'approved'
      },
      order: [['created_at', 'DESC']]
    });

    return customEmojis.map(emoji => ({
      id: emoji.id,
      name: emoji.name,
      code: `[${emoji.name}]`,
      url: emoji.url,
      thumbnailUrl: emoji.thumbnail_url,
      type: emoji.type,
      width: emoji.width,
      height: emoji.height,
      isCustom: true
    }));
  }

  /**
   * 清除表情系统所有缓存
   */
  async clearAllCache() {
    await emojiCacheService.clearAllCache({
      clearPacks: true,
      clearMap: true,
      clearSearch: true,
      clearHot: true
    });
    
    // 重置版本号为1，强制客户端全量更新
    await emojiCacheService.setVersion(1);
    
    logger.info('已清除表情系统所有缓存，版本号重置为1');
    
    return {
      success: true,
      message: '缓存清除成功，版本号已重置'
    };
  }
}

module.exports = new EmojiService();
