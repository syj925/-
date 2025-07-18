/**
 * 数据库配置检查脚本
 * 检查项目配置是否正确，数据库是否可连接
 */

const { Sequelize } = require('sequelize');
const path = require('path');

async function checkDatabaseConfig() {
  console.log('🔍 校园墙数据库配置检查');
  console.log('================================');
  
  try {
    // 1. 检查项目配置文件
    console.log('📋 1. 检查项目配置文件...');
    
    const configPath = path.join(__dirname, '../config');
    const projectConfig = require('../config');
    
    console.log(`   ✓ 配置目录: ${configPath}`);
    console.log(`   ✓ 当前环境: ${projectConfig.env}`);
    console.log(`   ✓ 服务端口: ${projectConfig.port}`);
    console.log('');
    
    // 2. 检查数据库配置
    console.log('🗄️ 2. 检查数据库配置...');
    const dbConfig = projectConfig.database;
    
    console.log(`   数据库名: ${dbConfig.database}`);
    console.log(`   主机地址: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   用户名: ${dbConfig.username}`);
    console.log(`   密码: ${'*'.repeat(dbConfig.password?.length || 0)}`);
    console.log(`   方言: ${dbConfig.dialect}`);
    console.log('');
    
    // 3. 检查Redis配置
    console.log('📡 3. 检查Redis配置...');
    const redisConfig = projectConfig.redis;
    
    console.log(`   Redis主机: ${redisConfig.host}:${redisConfig.port}`);
    console.log(`   数据库: ${redisConfig.db}`);
    console.log(`   密码: ${redisConfig.password ? '已设置' : '无密码'}`);
    console.log(`   键前缀: ${redisConfig.keyPrefix}`);
    console.log('');
    
    // 4. 测试数据库连接
    console.log('🔌 4. 测试数据库连接...');
    
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false
      }
    );
    
    await sequelize.authenticate();
    console.log('   ✅ 数据库连接成功');
    
    // 检查数据库是否存在
    const [results] = await sequelize.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${dbConfig.database}'`
    );
    
    if (results.length > 0) {
      console.log(`   ✅ 数据库 '${dbConfig.database}' 已存在`);
      
      // 检查表数量
      const [tables] = await sequelize.query(
        `SELECT COUNT(*) as table_count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbConfig.database}'`
      );
      
      console.log(`   📊 数据库包含 ${tables[0].table_count} 个表`);
    } else {
      console.log(`   ⚠️ 数据库 '${dbConfig.database}' 不存在，需要创建`);
    }
    
    await sequelize.close();
    console.log('');
    
    // 5. 测试Redis连接
    console.log('📡 5. 测试Redis连接...');
    
    try {
      const Redis = require('ioredis');
      const redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        db: redisConfig.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
      
      await redis.ping();
      console.log('   ✅ Redis连接成功');
      
      // 测试基本操作
      await redis.set('test_key', 'test_value');
      const value = await redis.get('test_key');
      await redis.del('test_key');
      
      if (value === 'test_value') {
        console.log('   ✅ Redis读写测试成功');
      }
      
      redis.disconnect();
    } catch (redisError) {
      console.log(`   ❌ Redis连接失败: ${redisError.message}`);
      console.log('   💡 请确保Redis服务正在运行');
    }
    
    console.log('');
    
    // 6. 检查模型文件
    console.log('📋 6. 检查模型文件...');
    
    const modelsPath = path.join(__dirname, '../src/models');
    const fs = require('fs');
    
    if (fs.existsSync(modelsPath)) {
      const modelFiles = fs.readdirSync(modelsPath)
        .filter(file => file.endsWith('.model.js'));
      
      console.log(`   ✅ 模型目录存在: ${modelsPath}`);
      console.log(`   📊 发现 ${modelFiles.length} 个模型文件:`);
      
      modelFiles.forEach(file => {
        console.log(`     - ${file}`);
      });
    } else {
      console.log(`   ❌ 模型目录不存在: ${modelsPath}`);
    }
    
    console.log('');
    console.log('🎉 配置检查完成！');
    
    return {
      success: true,
      database: dbConfig,
      redis: redisConfig
    };
    
  } catch (error) {
    console.error('❌ 配置检查失败:', error.message);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('');
      console.error('🔧 数据库连接问题解决建议:');
      console.error('   1. 确认MySQL服务已启动');
      console.error('   2. 检查数据库配置信息');
      console.error('   3. 验证用户名和密码');
      console.error('   4. 确认数据库端口未被占用');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkDatabaseConfig()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('检查过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = checkDatabaseConfig;
