/**
 * 数据库图片URL迁移脚本
 * 将绝对URL转换为相对路径，解决IP地址变化问题
 */

const mysql = require('mysql2/promise');
const config = require('../config');

// 需要迁移的表和字段配置（基于实际数据库结构）
const MIGRATION_CONFIG = [
  {
    table: 'post_images',
    fields: ['url'], // 图片URL字段
    type: 'string'
  },
  {
    table: 'users',
    fields: ['avatar', 'background_image'],
    type: 'string'
  }
];

// 需要替换的旧域名/IP列表（基于数据库中发现的实际URL）
const OLD_DOMAINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.11:3000',
  'http://192.168.159.1:3000',
  'http://172.168.9.133:3000',
  'http://172.168.4.28:3000'  // 从数据库中发现的新IP
];

/**
 * 将绝对URL转换为相对路径
 * @param {string} url 原始URL
 * @returns {string} 相对路径
 */
function convertToRelativePath(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // 如果已经是相对路径，直接返回
  if (url.startsWith('/uploads/') || url.startsWith('/static/')) {
    return url;
  }

  // 检查是否包含需要替换的域名
  for (const domain of OLD_DOMAINS) {
    if (url.startsWith(domain)) {
      // 提取相对路径部分
      const relativePath = url.replace(domain, '');
      return relativePath.startsWith('/') ? relativePath : '/' + relativePath;
    }
  }

  return url;
}

/**
 * 处理JSON字段中的图片URL
 * @param {string} jsonStr JSON字符串
 * @returns {string} 处理后的JSON字符串
 */
function processJsonImages(jsonStr) {
  if (!jsonStr) return jsonStr;

  try {
    const images = JSON.parse(jsonStr);
    if (Array.isArray(images)) {
      const processedImages = images.map(convertToRelativePath);
      return JSON.stringify(processedImages);
    }
  } catch (error) {
    console.warn('解析JSON失败:', jsonStr, error.message);
  }

  return jsonStr;
}

/**
 * 迁移指定表的图片URL
 * @param {Object} connection 数据库连接
 * @param {Object} tableConfig 表配置
 */
async function migrateTable(connection, tableConfig) {
  const { table, fields, type } = tableConfig;
  
  console.log(`\n开始迁移表: ${table}`);
  
  try {
    // 查询所有记录
    const [rows] = await connection.execute(`SELECT * FROM ${table}`);
    
    if (rows.length === 0) {
      console.log(`表 ${table} 没有数据，跳过迁移`);
      return;
    }

    let updatedCount = 0;

    for (const row of rows) {
      const updates = [];
      const values = [];
      let hasChanges = false;

      for (const field of fields) {
        const originalValue = row[field];
        let newValue;

        if (type === 'json') {
          newValue = processJsonImages(originalValue);
        } else {
          newValue = convertToRelativePath(originalValue);
        }

        if (originalValue !== newValue) {
          updates.push(`${field} = ?`);
          values.push(newValue);
          hasChanges = true;
          
          console.log(`  记录 ${row.id} 字段 ${field}:`);
          console.log(`    原值: ${originalValue}`);
          console.log(`    新值: ${newValue}`);
        }
      }

      if (hasChanges) {
        values.push(row.id);
        const updateSql = `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`;
        
        await connection.execute(updateSql, values);
        updatedCount++;
      }
    }

    console.log(`表 ${table} 迁移完成，更新了 ${updatedCount} 条记录`);

  } catch (error) {
    console.error(`迁移表 ${table} 时出错:`, error.message);
    throw error;
  }
}

/**
 * 主迁移函数
 */
async function migrate() {
  let connection;

  try {
    console.log('开始数据库图片URL迁移...');
    // 获取数据库配置
    const dbConfig = config.database;
    console.log('数据库配置:', {
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.username
    });

    // 创建数据库连接
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port
    });

    console.log('数据库连接成功');

    // 开始事务
    await connection.beginTransaction();

    // 迁移每个表
    for (const tableConfig of MIGRATION_CONFIG) {
      await migrateTable(connection, tableConfig);
    }

    // 提交事务
    await connection.commit();
    console.log('\n✅ 所有表迁移完成！');

  } catch (error) {
    console.error('\n❌ 迁移过程中出现错误:', error.message);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('已回滚所有更改');
      } catch (rollbackError) {
        console.error('回滚失败:', rollbackError.message);
      }
    }
    
    process.exit(1);

  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate, convertToRelativePath, processJsonImages };
