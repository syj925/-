require('dotenv').config();

const requireEnv = (name) => {
  const value = process.env[name];
  if (typeof value === 'undefined' || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const dbPassword = requireEnv('DB_PASSWORD');

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: dbPassword,
    database: process.env.DB_NAME || 'campus_community',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,  // 使用下划线命名法
      timestamps: true,   // 启用时间戳
      paranoid: true      // 软删除
    },
    timezone: '+08:00',   // 设置为北京时间
    logging: console.log
  },
  test: {
    username: process.env.DB_USERNAME || 'root',
    password: dbPassword,
    database: process.env.DB_NAME || 'campus_community_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true
    },
    timezone: '+08:00',
    logging: false
  },
  production: {
    username: process.env.DB_USERNAME,
    password: dbPassword,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    pool: {
      max: 50,
      min: 10,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true
    },
    timezone: '+08:00',
    logging: false
  }
}; 
