/**
 * 管理后台 WebSocket 工具类
 * 用于实时更新仪表盘数据，包括在线人数统计
 */
class AdminWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.heartbeatInterval = null;
    this.heartbeatTimer = 30000; // 30秒心跳
    this.callbacks = new Map();
    this.isConnected = false;
  }

  /**
   * 连接WebSocket
   * @param {string} token 管理员认证token
   */
  connect(token) {
    if (!token) {
      console.error('[AdminWebSocket] 缺少认证token');
      return;
    }

    try {
      // 从配置中获取WebSocket地址
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname;
      const wsPort = window.location.hostname === 'localhost' ? '3000' : window.location.port;
      const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}?token=${token}`;

      console.log('[AdminWebSocket] 尝试连接:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[AdminWebSocket] 连接失败:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * 设置WebSocket事件处理器
   */
  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('[AdminWebSocket] 连接成功');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.executeCallback('connected', { status: 'connected' });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[AdminWebSocket] 收到消息:', data);
        this.handleMessage(data);
      } catch (error) {
        console.error('[AdminWebSocket] 解析消息失败:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('[AdminWebSocket] 连接关闭:', event.code, event.reason);
      this.isConnected = false;
      this.stopHeartbeat();
      this.executeCallback('disconnected', { code: event.code, reason: event.reason });
      
      // 如果不是主动关闭，尝试重连
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[AdminWebSocket] 连接错误:', error);
      this.executeCallback('error', { error });
    };
  }

  /**
   * 处理接收到的消息
   * @param {Object} data 消息数据
   */
  handleMessage(data) {
    switch (data.type) {
      case 'online_count_update':
        // 在线人数更新
        this.executeCallback('onlineCountUpdate', {
          count: data.count,
          timestamp: data.timestamp
        });
        break;
      
      case 'pong':
        // 心跳响应
        console.log('[AdminWebSocket] 心跳响应');
        break;
      
      case 'connection':
        // 连接状态消息
        if (data.status === 'success') {
          console.log('[AdminWebSocket] 服务器确认连接成功');
        }
        break;
      
      default:
        console.log('[AdminWebSocket] 未处理的消息类型:', data.type);
    }
  }

  /**
   * 发送消息到服务器
   * @param {Object} data 消息数据
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[AdminWebSocket] WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, this.heartbeatTimer);
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[AdminWebSocket] 超过最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`[AdminWebSocket] ${delay / 1000}秒后尝试第${this.reconnectAttempts}次重连`);
    
    setTimeout(() => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        this.connect(token);
      }
    }, delay);
  }

  /**
   * 注册事件回调
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  /**
   * 移除事件回调
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  off(event, callback) {
    if (this.callbacks.has(event)) {
      const callbacks = this.callbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 执行事件回调
   * @param {string} event 事件名称
   * @param {Object} data 事件数据
   */
  executeCallback(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[AdminWebSocket] 执行${event}回调失败:`, error);
        }
      });
    }
  }

  /**
   * 关闭连接
   */
  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // 防止自动重连
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, '主动关闭');
      this.ws = null;
    }
    
    this.isConnected = false;
    console.log('[AdminWebSocket] 已主动断开连接');
  }

  /**
   * 获取连接状态
   * @returns {boolean} 是否已连接
   */
  isConnected() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// 导出单例实例
export default new AdminWebSocket();
