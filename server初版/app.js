const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const { testConnection, sequelize } = require('./config/db');
const { syncModels } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const config = require('./config/config');
const { initRedisClient } = require('./utils/cache');
const { addIndexes } = require('./scripts/add-indexes');

// 导入统一的模型入口点
const models = require('./models/init');

// 创建Express应用
const app = express();

// 使用环境变量中的端口或默认端口
const PORT = config.server.port;

// 基本中间件
app.use(helmet({
  crossOriginResourcePolicy: false,  // 禁用跨源资源策略限制
  crossOriginEmbedderPolicy: false   // 禁用跨源嵌入保护
}));
app.use(cors({
  origin: '*',                        // 允许所有源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
})); 
app.use(express.json());             // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 请求限流中间件
if (config.server.env === 'production') {
  const rateLimit = require('express-rate-limit');
  app.use(rateLimit({
    windowMs: config.performance.rateLimit.windowMs, 
    max: config.performance.rateLimit.max,
    message: { success: false, message: '请求过于频繁，请稍后再试' }
  }));
}

// 日志记录
app.use(morgan(config.server.env === 'production' ? 'combined' : 'dev'));

// 设置静态文件目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 使用路由 - 添加/api前缀
app.use('/api', routes);

// 默认路由
app.get('/', (req, res) => {
  res.json({
    message: 'API服务器正在运行',
    version: '1.0.0',
    apiEndpoint: '/api'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 设置数据库字段名称映射拦截器
const setupDbFieldNamesFix = () => {
  // 确保sequelize实例存在
  if (sequelize) {
    // 字段名称映射表
    const fieldMappings = {
      // 时间字段
      'createdAt': 'created_at',
      'updatedAt': 'updated_at', 
      'deletedAt': 'deleted_at',
      // 关联ID字段
      'creatorId': 'user_id',
      'creator_id': 'user_id',  // 处理creator_id -> user_id的映射
      'userId': 'user_id',
      'postId': 'post_id',
      'topicId': 'topic_id',
      'commentId': 'comment_id',
      'eventId': 'event_id',
      'categoryId': 'category_id',
      // 其他可能的映射...
    };

    // 保存原始查询方法
    const originalQuery = sequelize.query.bind(sequelize);
    
    // 重写查询方法，拦截所有SQL查询
    sequelize.query = function(sql, options) {
      // 只处理字符串类型的SQL查询
      if (typeof sql === 'string') {
        try {
          // 处理基础字段名映射
          Object.entries(fieldMappings).forEach(([jsField, dbField]) => {
            // 在SQL中查找字段名称并替换，确保只替换独立的字段名
            const jsFieldRegex = new RegExp(`([\\s\\(])"?${jsField}"?([\\s\\),])`, 'g');
            
            // 替换 JavaScript字段名 -> 数据库字段名
            sql = sql.replace(jsFieldRegex, (match, p1, p2) => `${p1}${dbField}${p2}`);
          });
        } catch (err) {
          console.error('SQL拦截器处理错误:', err);
          // 继续使用原始SQL
        }
      }
      
      // 使用原始查询方法执行修改后的SQL
      return originalQuery(sql, options);
    };
    
    console.log('数据库字段名称映射拦截器已设置完成');
  }
};

// 测试数据库连接并同步模型
const startServer = async () => {
  try {
    // 设置数据库字段名称修复
    setupDbFieldNamesFix();
    
    // 初始化Redis客户端
    try {
      await initRedisClient();
    } catch (redisError) {
      console.warn('Redis连接失败，应用将继续运行但性能可能受影响:', redisError.message);
    }
    
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      console.log('数据库连接成功');
      
      // 初始化模型关联关系
      console.log('正在初始化模型关联关系...');
      models.initializeAssociations();
    } else {
      console.warn('数据库连接失败，但服务器仍将启动（某些功能可能不可用）');
    }
    
    // 即使数据库连接失败，我们仍然启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口: ${PORT}`);
      console.log(`环境: ${config.server.env}`);
      console.log(`API地址: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

module.exports = app; 