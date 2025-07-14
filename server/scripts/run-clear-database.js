const mysql = require('mysql2/promise');

// 立即执行的异步函数
(async () => {
  console.log('正在尝试清理数据库...');
  let connection;
  
  try {
    console.log('正在连接到MySQL...');
    // 连接到MySQL（不指定数据库）
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '20060711'
    });
    
    console.log('MySQL连接成功');
    
    // 删除数据库（如果存在）
    console.log('尝试删除数据库（如果存在）...');
    await connection.query('DROP DATABASE IF EXISTS campus_community');
    console.log('已删除数据库（如果存在）');
    
    // 创建新数据库
    console.log('尝试创建新数据库...');
    await connection.query('CREATE DATABASE campus_community');
    console.log('已创建新数据库');
    
    console.log('数据库清理完成');
  } catch (error) {
    console.error('数据库操作失败:', error);
  } finally {
    if (connection) {
      try {
        // 关闭连接
        await connection.end();
        console.log('数据库连接已关闭');
      } catch (err) {
        console.error('关闭数据库连接时出错:', err);
      }
    }
  }
})(); 