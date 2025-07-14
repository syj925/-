const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config/config');

async function executeSqlFile() {
  try {
    // 读取SQL文件内容
    const sqlFilePath = path.join(__dirname, 'add-views-column.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    console.log('SQL文件内容:', sqlContent);
    
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      multipleStatements: true // 允许执行多条SQL语句
    });
    
    console.log('已连接到数据库');
    
    // 执行SQL语句
    const [results] = await connection.query(sqlContent);
    console.log('SQL执行结果:', results);
    
    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');
    
    console.log('成功添加views列到topics表');
  } catch (error) {
    console.error('执行SQL文件时出错:', error);
  }
}

// 执行SQL文件
executeSqlFile(); 