const WebSocket = require('ws');
const JwtUtil = require('./jwt');
const logger = require('../../config/logger');
const redisClient = require('./redis-client');

/**
 * WebSocket服务管理类
 */
class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // 用户ID -> WebSocket连接
  }

  /**
   * 初始化WebSocket服务
   * @param {Object} server HTTP服务器实例
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      this._handleConnection(ws, req);
    });

    logger.info('WebSocket服务已初始化');
  }

  /**
   * 处理新的WebSocket连接
   * @param {WebSocket} ws WebSocket连接
   * @param {Object} req HTTP请求对象
   * @private
   */
  _handleConnection(ws, req) {
    try {
      // 从URL中获取token
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        logger.warn('WebSocket连接请求缺少token');
        ws.close(4001, 'Authentication token required');
        return;
      }

      try {
        // 验证token - 使用JwtUtil类的静态方法
        const decoded = JwtUtil.verifyToken(token);
        if (!decoded) {
          logger.error('WebSocket认证失败: 无效的token');
          ws.close(4003, 'Authentication failed');
          return;
        }
        
        const userId = decoded.id;
        
        // 关联用户ID和WebSocket连接
        this._registerClient(userId, ws);

        // 设置连接状态为在线
        this._setUserOnline(userId).catch(err => {
          logger.error(`设置用户在线状态失败: ${err.message}`, { userId });
        });

        // 发送欢迎消息
        this._sendToClient(ws, {
          type: 'connection',
          status: 'success',
          message: '连接成功'
        });

        // 处理消息接收
        ws.on('message', (message) => {
          this._handleMessage(userId, message, ws);
        });

        // 处理连接关闭
        ws.on('close', () => {
          this._handleClose(userId, ws);
        });

        // 处理连接错误
        ws.on('error', (error) => {
          logger.error(`WebSocket连接错误: ${error.message}`, { userId });
        });

        // 发送未读消息数量
        this._sendUnreadCount(userId).catch(err => {
          logger.error(`发送未读消息数量失败: ${err.message}`, { userId });
        });
      } catch (err) {
        logger.error(`解析或验证token失败: ${err.message}`);
        ws.close(4003, 'Authentication failed');
      }
    } catch (err) {
      logger.error(`WebSocket连接处理异常: ${err.message}`);
      try {
        ws.close(4000, 'Internal server error');
      } catch (closeErr) {
        logger.error(`关闭WebSocket连接失败: ${closeErr.message}`);
      }
    }
  }

  /**
   * 注册客户端连接
   * @param {String} userId 用户ID
   * @param {WebSocket} ws WebSocket连接
   * @private
   */
  _registerClient(userId, ws) {
    if (this.clients.has(userId)) {
      // 如果用户已有连接，则添加到数组中
      const existingConnections = this.clients.get(userId);
      existingConnections.push(ws);
    } else {
      // 否则创建新数组
      this.clients.set(userId, [ws]);
    }

    logger.info(`用户 ${userId} 已连接WebSocket`);
  }

  /**
   * 解除客户端连接
   * @param {String} userId 用户ID
   * @param {WebSocket} ws WebSocket连接
   * @private
   */
  _unregisterClient(userId, ws) {
    if (!this.clients.has(userId)) return;

    // 过滤掉关闭的连接
    const connections = this.clients.get(userId).filter(conn => conn !== ws);

    if (connections.length === 0) {
      // 如果没有剩余连接，则移除用户
      this.clients.delete(userId);
      // 设置用户为离线
      this._setUserOffline(userId);
      logger.info(`用户 ${userId} 已断开所有WebSocket连接`);
    } else {
      // 否则更新连接数组
      this.clients.set(userId, connections);
    }
  }

  /**
   * 处理接收到的消息
   * @param {String} userId 用户ID
   * @param {String} message 消息内容
   * @param {WebSocket} ws WebSocket连接
   * @private
   */
  _handleMessage(userId, message, ws) {
    try {
      const data = JSON.parse(message);
      logger.debug(`收到来自用户 ${userId} 的消息:`, data);

      // 根据消息类型处理
      switch (data.type) {
        case 'ping':
          this._sendToClient(ws, { type: 'pong', timestamp: Date.now() });
          break;
        case 'subscribe':
          // 处理订阅请求
          break;
        case 'unsubscribe':
          // 处理取消订阅请求
          break;
        default:
          logger.warn(`未知的消息类型: ${data.type}`);
      }
    } catch (error) {
      logger.error('处理WebSocket消息错误:', error);
    }
  }

  /**
   * 处理连接关闭
   * @param {String} userId 用户ID
   * @param {WebSocket} ws WebSocket连接
   * @private
   */
  _handleClose(userId, ws) {
    this._unregisterClient(userId, ws);
  }

  /**
   * 向客户端发送消息
   * @param {WebSocket} ws WebSocket连接
   * @param {Object} data 消息数据
   * @private
   */
  _sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * 向用户发送消息
   * @param {String} userId 用户ID
   * @param {Object} data 消息数据
   * @returns {Boolean} 是否发送成功
   */
  sendToUser(userId, data) {
    if (!this.clients.has(userId)) {
      return false;
    }

    const connections = this.clients.get(userId);
    connections.forEach(ws => {
      this._sendToClient(ws, data);
    });

    return true;
  }

  /**
   * 向多个用户发送消息
   * @param {Array<String>} userIds 用户ID数组
   * @param {Object} data 消息数据
   * @returns {Object} 发送结果
   */
  sendToUsers(userIds, data) {
    const results = {
      success: 0,
      failed: 0
    };

    userIds.forEach(userId => {
      const sent = this.sendToUser(userId, data);
      if (sent) {
        results.success++;
      } else {
        results.failed++;
      }
    });

    return results;
  }

  /**
   * 向所有连接的用户发送消息
   * @param {Object} data 消息数据
   * @returns {Number} 成功发送的用户数
   */
  broadcast(data) {
    let successCount = 0;

    for (const [userId, connections] of this.clients.entries()) {
      connections.forEach(ws => {
        this._sendToClient(ws, data);
      });
      successCount++;
    }

    return successCount;
  }

  /**
   * 发送用户未读消息数量
   * @param {String} userId 用户ID
   * @private
   */
  async _sendUnreadCount(userId) {
    try {
      // 从Redis获取未读消息数量
      const unreadCount = await redisClient.get(`unread:${userId}`) || 0;
      
      this.sendToUser(userId, {
        type: 'unread_count',
        count: parseInt(unreadCount, 10)
      });
    } catch (error) {
      logger.error(`获取用户未读消息数量失败: ${error.message}`, { userId });
    }
  }

  /**
   * 设置用户在线状态
   * @param {String} userId 用户ID
   * @private
   */
  async _setUserOnline(userId) {
    try {
      const cacheConfig = require('../../config/cache');
      await redisClient.set(`online:${userId}`, '1', cacheConfig.REALTIME.ONLINE_STATUS); // 在线状态过期
    } catch (error) {
      logger.error(`设置用户在线状态失败: ${error.message}`, { userId });
    }
  }

  /**
   * 设置用户离线状态
   * @param {String} userId 用户ID
   * @private
   */
  async _setUserOffline(userId) {
    try {
      await redisClient.del(`online:${userId}`);
    } catch (error) {
      logger.error(`设置用户离线状态失败: ${error.message}`, { userId });
    }
  }

  /**
   * 检查用户是否在线
   * @param {String} userId 用户ID
   * @returns {Promise<Boolean>} 用户是否在线
   */
  async isUserOnline(userId) {
    try {
      const status = await redisClient.get(`online:${userId}`);
      return !!status;
    } catch (error) {
      logger.error(`检查用户在线状态失败: ${error.message}`, { userId });
      return false;
    }
  }

  /**
   * 获取在线用户数量
   * @returns {Number} 在线用户数量
   */
  getOnlineCount() {
    return this.clients.size;
  }
}

// 创建单例
const webSocketService = new WebSocketService();

module.exports = webSocketService; 