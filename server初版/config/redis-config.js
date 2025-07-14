/**
 * Redis配置文件
 * 用于连接本地Redis服务
 */
module.exports = {
  // 提供详细的Redis连接配置，避免使用URL格式
  host: '192.168.159.130',  // Redis主机IP
  port: 6379,               // Redis端口
  username: '',             // 如有需要
  password: '',             // 如有需要
  db: 0,                    // 默认数据库
  
  // 备选连接方式 (如果上面的配置不起作用，可以尝试以下方式)
  // url: 'redis://192.168.159.130:6379',
  
  // 连接选项
  socketOptions: {
    connectTimeout: 20000,  // 连接超时设置为20秒
    keepAlive: true,
    keepAliveInitialDelay: 10000
  },
  ttl: 86400,               // 默认缓存1天
  enabled: true,           //// 现在是启用Redis，使应用以无缓存模式运行
  maxRetries: 5,            // 重试次数
  retryDelay: 2000          // 重试延迟(ms)
}; 