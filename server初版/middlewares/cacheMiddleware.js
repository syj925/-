const { getCache, setCache } = require('../utils/cache');
const config = require('../config/config');

/**
 * 请求缓存中间件
 * @param {string} key 缓存键前缀
 * @param {number} duration 缓存时间（秒）
 * @param {Function} keyGenerator 自定义缓存键生成函数
 * @returns {Function} Express中间件
 */
exports.cacheRequest = (key, duration, keyGenerator) => {
  return async (req, res, next) => {
    // 如果没有设置生产环境，跳过缓存
    if (config.server.env !== 'production') {
      // 在开发环境下设置明确的不缓存头
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      return next();
    }

    // 如果用户已认证，跳过缓存（用户相关数据不适合缓存共享）
    if (req.user) {
      // 对已认证用户请求设置不缓存头
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return next();
    }

    try {
    // 根据请求生成缓存键
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `${key}:${req.originalUrl || req.url}`;

    // 尝试获取缓存
    const cachedData = await getCache(cacheKey);
      
    if (cachedData) {
        // 始终确保设置了正确的Content-Type头，即使是304响应
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Cache-Hit', 'true');
        
        // 设置适当的缓存控制头，但仅缓存短时间
        res.setHeader('Cache-Control', `public, max-age=${Math.min(duration, 60)}`);
        
        // 发送JSON响应
      return res.status(200).json(cachedData);
    }

    // 如果没有缓存，劫持res.json方法，在发送响应前缓存结果
    const originalJson = res.json;
    res.json = function(data) {
      // 如果请求成功，并且有数据，则缓存结果
        if (data && data.success !== undefined) {
          if (data.success && data.data) {
            setCache(cacheKey, data, duration)
              .catch(err => console.error(`缓存设置失败: ${cacheKey}`, err));
      }
          
          // 始终确保设置了正确的Content-Type头
          res.setHeader('Content-Type', 'application/json');
          
          // 添加适当的缓存控制头
          res.setHeader('Cache-Control', `public, max-age=${Math.min(duration, 60)}`);
          return originalJson.call(this, data);
        }
        
        // 如果数据格式不符合预期，设置无缓存头并返回原始数据
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return originalJson.call(this, data);
    };

    next();
    } catch (error) {
      console.error('缓存中间件错误:', error);
      
      // 出错时设置无缓存头
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Content-Type', 'application/json');
      
      // 出现错误时继续处理请求而不使用缓存
      next();
    }
  };
};

/**
 * 清除特定类型的缓存
 * @param {string} pattern 缓存键模式
 * @returns {Function} Express中间件
 */
exports.clearCache = (pattern) => {
  return async (req, res, next) => {
    try {
    // 保存原始的end方法
    const originalEnd = res.end;

    // 重写end方法
    res.end = async function(...args) {
      // 如果请求成功（状态码2xx）
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const { deletePattern } = require('../utils/cache');
          await deletePattern(pattern);
            console.log(`缓存已清除: ${pattern}`);
        } catch (error) {
          console.error(`清除缓存失败: ${pattern}`, error);
        }
      }

      // 调用原始end方法
      return originalEnd.apply(this, args);
    };

    next();
    } catch (error) {
      console.error('清除缓存中间件错误:', error);
      next();
    }
  };
}; 