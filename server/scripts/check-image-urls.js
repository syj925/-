/**
 * 检查数据库中的图片URL格式
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function checkImageUrls() {
  let connection;

  try {
    console.log('连接数据库...');
    
    // 获取数据库配置
    const dbConfig = config.database;
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port
    });

    console.log('数据库连接成功\n');

    // 先查看表结构
    console.log('=== 查看帖子表结构 ===');
    const [postColumns] = await connection.execute('DESCRIBE posts');
    console.log('帖子表字段:');
    postColumns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    console.log('\n=== 查看用户表结构 ===');
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('用户表字段:');
    userColumns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    // 查看所有表
    console.log('\n=== 查看所有表 ===');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('数据库中的表:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  ${tableName}`);
    });

    // 检查帖子表的图片 - 使用正确的字段名
    console.log('\n=== 检查帖子表图片 ===');

    // 先尝试常见的字段名
    const imageFields = ['images', 'image', 'image_urls', 'attachments'];
    let postImageField = null;

    for (const field of imageFields) {
      const fieldExists = postColumns.some(col => col.Field === field);
      if (fieldExists) {
        postImageField = field;
        break;
      }
    }

    if (postImageField) {
      console.log(`使用字段: ${postImageField}`);
      const [posts] = await connection.execute(
        `SELECT id, ${postImageField} FROM posts WHERE ${postImageField} IS NOT NULL AND ${postImageField} != "" LIMIT 10`
      );

      if (posts.length > 0) {
        posts.forEach(post => {
          console.log(`帖子 ${post.id}: ${post[postImageField]}`);
        });
      } else {
        console.log('没有找到包含图片的帖子');
      }
    } else {
      console.log('没有找到图片相关字段');
    }

    // 检查用户表的头像
    console.log('\n=== 检查用户头像 ===');
    const [users] = await connection.execute(
      'SELECT id, username, avatar FROM users WHERE avatar IS NOT NULL AND avatar != "" LIMIT 10'
    );
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`用户 ${user.id} (${user.username}): ${user.avatar}`);
      });
    } else {
      console.log('没有找到设置头像的用户');
    }

    // 检查用户表的背景图片
    console.log('\n=== 检查用户背景图片 ===');
    const [backgrounds] = await connection.execute(
      'SELECT id, username, background_image FROM users WHERE background_image IS NOT NULL AND background_image != "" LIMIT 10'
    );
    
    if (backgrounds.length > 0) {
      backgrounds.forEach(user => {
        console.log(`用户 ${user.id} (${user.username}): ${user.background_image}`);
      });
    } else {
      console.log('没有找到设置背景图片的用户');
    }

    // 统计包含绝对URL的记录
    console.log('\n=== 统计绝对URL ===');

    const [avatarCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE avatar LIKE "%http%"'
    );
    console.log(`包含绝对URL的头像: ${avatarCount[0].count} 条`);

    const [bgCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE background_image LIKE "%http%"'
    );
    console.log(`包含绝对URL的背景图片: ${bgCount[0].count} 条`);

    // 检查是否有图片相关的表
    console.log('\n=== 检查图片相关表 ===');
    const imageTableNames = ['post_images', 'images', 'attachments', 'media'];

    for (const tableName of imageTableNames) {
      try {
        const [tableExists] = await connection.execute(`SHOW TABLES LIKE '${tableName}'`);
        if (tableExists.length > 0) {
          console.log(`找到表: ${tableName}`);
          const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
          console.log(`${tableName} 表字段:`);
          columns.forEach(col => {
            console.log(`  ${col.Field} (${col.Type})`);
          });

          // 检查该表中的URL
          const [records] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
          if (records.length > 0) {
            console.log(`${tableName} 表数据示例:`);
            records.forEach((record, index) => {
              console.log(`  记录 ${index + 1}:`, record);
            });
          }
        }
      } catch (error) {
        // 表不存在，忽略错误
      }
    }

  } catch (error) {
    console.error('检查过程中出现错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 执行检查
checkImageUrls().catch(console.error);
