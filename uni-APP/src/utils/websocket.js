/**
 * WebSocket客户端服务
 */

// 导入配置
import appConfig from '@/config';

// WebSocket连接URL - 根据配置自动选择
let WS_URL;

// 获取WebSocket URL
const getWsUrl = () => {
  // 从配置获取最佳服务器地址
  const serverUrl = appConfig.getBestServer();
  
  if (serverUrl) {
    // 将HTTP/HTTPS转换为WS/WSS
    return serverUrl.replace(/^http/, 'ws') + '/ws';
  }
  
  // #ifdef H5
  // 检查当前是否在localhost环境
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  // H5开发环境使用相对路径
  return isLocalhost ? 'ws://localhost:3000/ws' : 'ws://192.168.1.9:3000/ws';
  // #endif

  // #ifdef APP-PLUS || MP
  // 移动设备环境使用IP地址
  return 'ws://192.168.1.9:3000/ws';
  // #endif
};

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3秒
    this.listeners = {};
    this.pingInterval = null;
    this.connecting = false; // 标记是否正在连接中
  }

  /**
   * 连接WebSocket服务器
   * @param {String} token 认证token
   * @returns {Promise} 连接结果
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      if (this.connecting) {
        console.log('WebSocket连接正在进行中...');
        resolve(false);
        return;
      }

      this.connecting = true;

      try {
        // 断开之前的连接
        if (this.socket) {
          this.disconnect();
        }

        // 检查token有效性
        if (!token) {
          // 尝试从存储中获取token
          token = uni.getStorageSync('token');
          if (!token) {
            console.warn('无法连接WebSocket: 未提供token且存储中没有token');
            this.connecting = false;
            reject(new Error('未提供token'));
            return;
          }
        }

        // 获取当前最佳WebSocket URL
        const wsUrl = getWsUrl();
        
        // 创建URL，添加token参数
        const fullWsUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;
        
        console.log('开始连接WebSocket...', wsUrl);
        
        // 创建新的WebSocket连接
        this.socket = uni.connectSocket({
          url: fullWsUrl,
          complete: (res) => {
            if (res.errMsg && res.errMsg.indexOf('fail') !== -1) {
              console.error('WebSocket连接创建失败:', res);
              this.connecting = false;
              reject(res);
            }
          }
        });

        // 监听连接打开
        uni.onSocketOpen((res) => {
          console.log('WebSocket连接已打开:', res);
          this.isConnected = true;
          this.connecting = false;
          this.reconnectAttempts = 0;
          this._setupPing();
          resolve(true);

          // 发送连接成功的事件
          this._triggerEvent('connected', {});
        });

        // 监听连接关闭
        uni.onSocketClose((res) => {
          console.log('WebSocket连接已关闭:', res);
          this.isConnected = false;
          this.connecting = false;
          clearInterval(this.pingInterval);
          
          // 触发断开连接事件
          this._triggerEvent('disconnected', {});
          
          // 尝试重连
          if (res.code !== 1000) { // 非正常关闭才重连
            this._attemptReconnect(token);
          }
        });

        // 监听连接错误
        uni.onSocketError((err) => {
          console.error('WebSocket连接错误:', err);
          this.isConnected = false;
          this.connecting = false;
          clearInterval(this.pingInterval);
          
          // 触发错误事件
          this._triggerEvent('error', { error: err });
          
          reject(err);
        });

        // 监听消息
        uni.onSocketMessage((res) => {
          try {
            const data = JSON.parse(res.data);
            this._handleMessage(data);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
            this._triggerEvent('error', { error, raw: res.data });
          }
        });
      } catch (error) {
        console.error('创建WebSocket连接异常:', error);
        this.connecting = false;
        reject(error);
      }
    });
  }

  /**
   * 触发内部事件
   * @param {String} event 事件名称
   * @param {Object} data 事件数据
   */
  _triggerEvent(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`执行${event}事件监听器异常:`, error);
        }
      });
    }
  }

  /**
   * 断开WebSocket连接
   */
  disconnect() {
    if (this.socket && this.isConnected) {
      uni.closeSocket({
        success: () => {
          console.log('WebSocket连接已关闭');
        }
      });
      this.isConnected = false;
      clearInterval(this.pingInterval);
    }
  }

  /**
   * 发送消息
   * @param {Object} data 消息数据
   * @returns {Boolean} 是否发送成功
   */
  send(data) {
    if (!this.isConnected) {
      console.warn('WebSocket未连接，无法发送消息');
      return false;
    }

    try {
      uni.sendSocketMessage({
        data: JSON.stringify(data),
        success: () => {
          console.log('WebSocket消息发送成功');
        },
        fail: (err) => {
          console.error('WebSocket消息发送失败:', err);
        }
      });
      return true;
    } catch (error) {
      console.error('发送WebSocket消息异常:', error);
      return false;
    }
  }

  /**
   * 添加事件监听器
   * @param {String} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * 移除事件监听器
   * @param {String} event 事件名称
   * @param {Function} callback 回调函数，不传则移除所有
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    if (!callback) {
      delete this.listeners[event];
    } else {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * 处理接收到的消息
   * @param {Object} data 消息数据
   * @private
   */
  _handleMessage(data) {
    const { type } = data;
    
    // 处理pong响应
    if (type === 'pong') {
      return;
    }
    
    // 触发对应事件的监听器
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`执行${type}事件监听器异常:`, error);
        }
      });
    }
    
    // 触发全局消息监听器
    if (this.listeners['message']) {
      this.listeners['message'].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('执行全局消息监听器异常:', error);
        }
      });
    }
  }

  /**
   * 设置定时ping
   * @private
   */
  _setupPing() {
    // 清除之前的定时器
    clearInterval(this.pingInterval);
    
    // 每30秒发送一次ping
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000);
  }

  /**
   * 尝试重新连接
   * @param {String} token 认证token
   * @private
   */
  _attemptReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('WebSocket重连次数超过最大限制，停止重连');
      return;
    }
    
    this.reconnectAttempts++;
    
    console.log(`WebSocket尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect(token).catch(err => {
        console.error('WebSocket重连失败:', err);
      });
    }, this.reconnectInterval);
  }
}

// 创建单例
const wsClient = new WebSocketClient();

export default wsClient; 