'use strict';

/**
 * 数据库初始化脚本
 * 
 * 此脚本执行以下操作：
 * 1. 创建数据库（如果不存在）
 * 2. 测试数据库连接
 * 3. 同步模型到数据库（安全模式，不修改现有索引名称）
 * 4. 应用必要的迁移
 */

const { createDatabase, testConnection } = require('./config/db');
const { syncModels } = require('./models');
const config = require('./config/config');
const { addIndexes } = require('./scripts/add-indexes');

// 延迟执行，便于日志查看
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 主函数
async function initDatabase() {
  console.log('=============================================');
  console.log('开始数据库初始化...');
  console.log('=============================================');
  console.log('\n数据库信息:');
  console.log(`- 主机: ${config.database.host}`);
  console.log(`- 端口: ${config.database.port}`);
  console.log(`- 用户: ${config.database.user}`);
  console.log(`- 数据库名: ${config.database.name}`);
  console.log(`- 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log('---------------------------------------------\n');

  try {
    // 步骤1: 创建数据库（如果不存在）
    console.log('步骤1: 创建数据库（如果不存在）...');
    const dbCreated = await createDatabase();
    
    if (!dbCreated) {
      throw new Error('创建数据库失败');
    }
    
    console.log('数据库创建成功或已存在\n');
    await wait(500); // 等待0.5秒
    
    // 步骤2: 测试数据库连接
    console.log('步骤2: 测试数据库连接...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('连接数据库失败');
    }
    
    console.log('数据库连接成功\n');
    await wait(500); // 等待0.5秒
    
    // 步骤3: 同步模型到数据库
    console.log('步骤3: 同步模型到数据库...');
    try {
      await syncModels();
      console.log('模型同步成功\n');
    } catch (syncError) {
      console.warn('模型同步遇到问题，但初始化过程将继续:');
      console.warn(syncError.message);
      console.log('\n');
    }
    
    await wait(500); // 等待0.5秒
    
    // 步骤4: 优化索引
    console.log('步骤4: 优化数据库索引...');
    try {
      await addIndexes();
      console.log('索引优化成功\n');
    } catch (indexError) {
      console.warn('索引优化遇到问题，但初始化过程将继续:');
      console.warn(indexError.message);
      console.log('\n');
    }
    
    await wait(500); // 等待0.5秒
    
    console.log('=============================================');
    console.log('数据库初始化完成!');
    console.log('=============================================');
    
    process.exit(0);
  } catch (error) {
    console.error('\n=============================================');
    console.error('数据库初始化失败:');
    console.error(error);
    console.error('=============================================');
    
    process.exit(1);
  }
}

// 执行初始化
initDatabase(); 