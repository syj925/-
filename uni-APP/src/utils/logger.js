/**
 * 校园墙应用日志工具
 * 用于统一管理应用日志输出和收集
 */

class Logger {
  constructor() {
    this.isDebug = process.env.NODE_ENV === 'development';
    this.logs = [];
    this.maxLogs = 1000; // 最大保存日志数量
    
    // 日志收集开关 - 默认关闭，需要用户主动开启
    this.isEnabled = false;
    this.enableTime = null; // 记录开启时间
  }

  /**
   * 格式化时间戳
   */
  formatTime() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').slice(0, 19);
  }

  /**
   * 创建日志条目
   */
  createLogEntry(level, message, data = null) {
    const entry = {
      timestamp: this.formatTime(),
      level: level.toUpperCase(),
      message,
      data,
      url: this.getCurrentPage(),
      userAgent: this.getUserAgent()
    };

    // 只有在日志收集开启时才保存到内存
    if (this.isEnabled) {
      this.logs.push(entry);
      
      // 超出最大数量时删除旧日志
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    }

    return entry;
  }

  /**
   * 获取当前页面路径
   */
  getCurrentPage() {
    try {
      const pages = getCurrentPages();
      return pages.length > 0 ? pages[pages.length - 1].route : 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * 获取用户代理信息
   */
  getUserAgent() {
    // #ifdef H5
    return navigator.userAgent;
    // #endif
    
    // #ifdef APP-PLUS
    return `uni-app/${uni.getSystemInfoSync().platform}`;
    // #endif
    
    // #ifdef MP
    return `miniprogram/${uni.getSystemInfoSync().platform}`;
    // #endif
  }

  /**
   * 调试日志
   */
  debug(message, data = null) {
    const entry = this.createLogEntry('debug', message, data);
    
    if (this.isDebug) {
      console.log(`🐛 [${entry.timestamp}] [${entry.url}] ${message}`, data || '');
    }
  }

  /**
   * 信息日志
   */
  info(message, data = null) {
    const entry = this.createLogEntry('info', message, data);
    
    console.log(`ℹ️ [${entry.timestamp}] [${entry.url}] ${message}`, data || '');
  }

  /**
   * 警告日志
   */
  warn(message, data = null) {
    const entry = this.createLogEntry('warn', message, data);
    
    console.warn(`⚠️ [${entry.timestamp}] [${entry.url}] ${message}`, data || '');
  }

  /**
   * 错误日志
   */
  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null;
    
    const entry = this.createLogEntry('error', message, errorData);
    
    console.error(`❌ [${entry.timestamp}] [${entry.url}] ${message}`, error || '');
    
    // 错误日志立即尝试上传
    this.uploadErrorLog(entry);
  }

  /**
   * 网络请求日志
   */
  network(method, url, status, duration, data = null) {
    const message = `${method.toUpperCase()} ${url} - ${status} (${duration}ms)`;
    const entry = this.createLogEntry('network', message, {
      method,
      url,
      status,
      duration,
      requestData: data
    });
    
    if (this.isDebug) {
      console.log(`🌐 [${entry.timestamp}] ${message}`, data || '');
    }
  }

  /**
   * 用户行为日志
   */
  userAction(action, target, data = null) {
    const message = `用户${action}: ${target}`;
    const entry = this.createLogEntry('action', message, {
      action,
      target,
      data
    });
    
    if (this.isDebug) {
      console.log(`👤 [${entry.timestamp}] ${message}`, data || '');
    }
  }

  /**
   * 性能日志
   */
  performance(metric, value, unit = 'ms') {
    const message = `性能指标 ${metric}: ${value}${unit}`;
    const entry = this.createLogEntry('performance', message, {
      metric,
      value,
      unit
    });
    
    if (this.isDebug) {
      console.log(`⚡ [${entry.timestamp}] ${message}`);
    }
  }

  /**
   * 获取所有日志
   */
  getAllLogs() {
    return [...this.logs];
  }

  /**
   * 开启日志收集
   */
  enableLogging() {
    if (!this.isEnabled) {
      this.isEnabled = true;
      this.enableTime = new Date();
      
      // 记录开启日志
      const entry = {
        timestamp: this.formatTime(),
        level: 'INFO',
        message: '🟢 日志收集已开启',
        data: { enableTime: this.enableTime },
        url: this.getCurrentPage(),
        userAgent: this.getUserAgent()
      };
      this.logs.push(entry);
      
      console.log('🟢 日志收集已开启');
      return true;
    }
    return false;
  }

  /**
   * 关闭日志收集
   */
  disableLogging() {
    if (this.isEnabled) {
      // 记录关闭日志
      const entry = {
        timestamp: this.formatTime(),
        level: 'INFO',
        message: '🔴 日志收集已关闭',
        data: { 
          disableTime: new Date(),
          collectionDuration: this.enableTime ? new Date() - this.enableTime : 0,
          totalLogs: this.logs.length
        },
        url: this.getCurrentPage(),
        userAgent: this.getUserAgent()
      };
      this.logs.push(entry);
      
      this.isEnabled = false;
      this.enableTime = null;
      
      console.log('🔴 日志收集已关闭');
      return true;
    }
    return false;
  }

  /**
   * 获取日志收集状态
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      enableTime: this.enableTime,
      totalLogs: this.logs.length,
      maxLogs: this.maxLogs,
      collectionDuration: this.enableTime ? new Date() - this.enableTime : 0
    };
  }

  /**
   * 获取错误日志
   */
  getErrorLogs() {
    return this.logs.filter(log => log.level === 'ERROR');
  }

  /**
   * 清除日志
   */
  clearLogs() {
    this.logs = [];
    console.log('📝 日志已清除');
  }

  /**
   * 上传错误日志到服务器
   */
  async uploadErrorLog(logEntry) {
    try {
      // 这里可以调用您的API上传日志
      // await this.$api.logs.uploadError(logEntry);
      console.log('📤 错误日志准备上传:', logEntry);
    } catch (e) {
      console.error('❌ 日志上传失败:', e);
    }
  }

  /**
   * 批量上传日志
   */
  async uploadLogs() {
    try {
      if (this.logs.length === 0) {
        console.log('📝 没有日志需要上传');
        return;
      }

      const logsToUpload = [...this.logs];
      
      // 这里可以调用您的API批量上传日志
      // await this.$api.logs.batchUpload(logsToUpload);
      
      console.log(`📤 已上传 ${logsToUpload.length} 条日志`);
      this.clearLogs();
      
    } catch (e) {
      console.error('❌ 批量上传日志失败:', e);
    }
  }

  /**
   * 导出日志到文件
   */
  exportLogs() {
    try {
      const logContent = this.logs.map(log => {
        return `[${log.timestamp}] [${log.level}] [${log.url}] ${log.message}${log.data ? '\n数据: ' + JSON.stringify(log.data, null, 2) : ''}`;
      }).join('\n\n');

      // #ifdef H5
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `校园墙_日志_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      // #endif

      // #ifdef APP-PLUS
      // 在APP中可以使用plus.io写入文件
      console.log('📄 日志内容:', logContent);
      // #endif

      console.log('💾 日志已导出');
    } catch (e) {
      console.error('❌ 导出日志失败:', e);
    }
  }
}

// 创建全局日志实例
const logger = new Logger();

// 全局错误捕获
// #ifdef H5
window.addEventListener('error', (event) => {
  logger.error('全局JavaScript错误', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('未处理的Promise拒绝', {
    reason: event.reason,
    promise: event.promise
  });
});
// #endif

export default logger;
