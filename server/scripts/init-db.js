const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// 数据库配置
const config = {
  database: process.env.DB_NAME || 'campus_community',
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '20060711',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
};

// 连接到MySQL（不指定数据库名）
const rootSequelize = new Sequelize(null, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: console.log
});

async function initDatabase() {
  try {
    // 连接到MySQL
    await rootSequelize.authenticate();
    console.log('MySQL连接成功');

    // 创建数据库
    const dbName = config.database;
    await rootSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`数据库 ${dbName} 创建成功或已存在`);

    // 关闭root连接
    await rootSequelize.close();

    // 连接到新创建的数据库
    const sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: console.log,
      define: {
        underscored: true,
        timestamps: true,
        paranoid: true
      }
    });

    // 加载模型定义
    const models = {
      User: require('../src/models/user.model')(sequelize, Sequelize.DataTypes),
      Post: require('../src/models/post.model')(sequelize, Sequelize.DataTypes),
      Category: require('../src/models/category.model')(sequelize, Sequelize.DataTypes),
      PostImage: require('../src/models/post-image.model')(sequelize, Sequelize.DataTypes),
      Comment: require('../src/models/comment.model')(sequelize, Sequelize.DataTypes),
      Topic: require('../src/models/topic.model')(sequelize, Sequelize.DataTypes),
      Like: require('../src/models/like.model')(sequelize, Sequelize.DataTypes),
      Favorite: require('../src/models/favorite.model')(sequelize, Sequelize.DataTypes),
      Message: require('../src/models/message.model')(sequelize, Sequelize.DataTypes),
      Follow: require('../src/models/follow.model')(sequelize, Sequelize.DataTypes)
    };

    // 设置模型关联
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });

    // 同步所有模型到数据库
    console.log('开始同步模型到数据库...');
    await sequelize.sync({ alter: true });
    console.log('模型同步完成');

    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('初始化数据库时出错:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行初始化
initDatabase(); 