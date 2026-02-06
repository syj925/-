require('dotenv').config();

module.exports = {
  development: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
    keyPrefix: 'campus_community:dev:'
  },
  test: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 1,
    keyPrefix: 'campus_community:test:'
  },
  production: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
    keyPrefix: 'campus_community:prod:',
    // 生产环境启用TLS
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  }
}; 