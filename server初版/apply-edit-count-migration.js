/**
 * 应用帖子编辑次数限制迁移
 * 这个脚本用于直接应用迁移，避免使用Sequelize迁移机制可能遇到的问题
 */

const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config');
const path = require('path');
const fs = require('fs');

// 数据库配置
const dbConfig = config.database;

// 连接数据库
const sequelize = new Sequelize(dbConfig.name, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'mysql',
  logging: console.log
});

async function applyMigration() {
  try {
    console.log('开始应用帖子编辑次数限制迁移...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功！');
    
    // 检查posts表是否存在edit_count字段
    const [checkResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${dbConfig.name}' 
      AND TABLE_NAME = 'posts' 
      AND COLUMN_NAME = 'edit_count'
    `);
    
    if (checkResults.length > 0) {
      console.log('edit_count字段已存在，跳过创建...');
    } else {
      // 添加edit_count字段
      await sequelize.query(`
        ALTER TABLE posts 
        ADD COLUMN edit_count INT NOT NULL DEFAULT 0 
        COMMENT '帖子编辑次数，用于限制编辑'
      `);
      console.log('成功添加edit_count字段到posts表');
      
      // 创建索引
      try {
        await sequelize.query(`
          CREATE INDEX idx_posts_edit_count ON posts(edit_count)
        `);
        console.log('成功为edit_count字段创建索引');
      } catch (indexError) {
        console.log('创建索引失败，可能已存在:', indexError.message);
      }
    }
    
    // 为已有的帖子设置初始编辑次数
    await sequelize.query(`
      UPDATE posts SET edit_count = 0 WHERE edit_count IS NULL
    `);
    console.log('为现有帖子初始化编辑次数');
    
    // 记录迁移已执行
    const migrationName = '20250526100000-add-edit-count-to-posts.js';
    const migrationExists = await sequelize.query(`
      SELECT name FROM SequelizeMeta WHERE name = '${migrationName}'
    `);
    
    if (!migrationExists[0].length) {
      await sequelize.query(`
        INSERT INTO SequelizeMeta (name) VALUES ('${migrationName}')
      `);
      console.log('已将迁移记录添加到SequelizeMeta表');
    }
    
    console.log('帖子编辑次数限制迁移成功应用!');
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行迁移
applyMigration(); 