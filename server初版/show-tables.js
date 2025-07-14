'use strict';

/**
 * 显示数据库表结构
 */
const mysql = require('mysql2/promise');
const config = require('./config/config');

async function showTables() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name
    });
    
    console.log('连接成功，获取表列表...');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('数据库中没有表');
      return;
    }
    
    console.log(`\n数据库 ${config.database.name} 中的表:`);
    console.log('===============================================');
    
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log(`\n表名: ${tableName}`);
      console.log('-----------------------------------------------');
      
      // 获取表结构
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      console.log('字段:');
      columns.forEach(column => {
        console.log(`  ${column.Field} (${column.Type})${column.Null === 'YES' ? ' NULL' : ' NOT NULL'}${column.Key === 'PRI' ? ' PRIMARY KEY' : ''}${column.Default ? ` DEFAULT '${column.Default}'` : ''}`);
      });
      
      // 获取索引
      const [indexes] = await connection.query(`SHOW INDEX FROM ${tableName}`);
      
      // 按索引名分组
      const indexMap = {};
      indexes.forEach(idx => {
        if (!indexMap[idx.Key_name]) {
          indexMap[idx.Key_name] = {
            name: idx.Key_name,
            columns: [],
            unique: idx.Non_unique === 0
          };
        }
        indexMap[idx.Key_name].columns.push(idx.Column_name);
      });
      
      if (Object.keys(indexMap).length > 0) {
        console.log('索引:');
        Object.values(indexMap).forEach(idx => {
          console.log(`  ${idx.name} (${idx.unique ? 'UNIQUE' : 'NON-UNIQUE'}) -> 字段: ${idx.columns.join(', ')}`);
        });
      }
    }
    
    console.log('\n===============================================');
    
  } catch (error) {
    console.error('获取表结构时出错:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行函数
showTables()
  .then(() => {
    console.log('查询完成');
    process.exit(0);
  })
  .catch(err => {
    console.error('执行失败:', err);
    process.exit(1);
  }); 