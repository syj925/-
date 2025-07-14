/**
 * 数据库索引优化脚本
 * 为提高高并发性能，添加必要的索引
 * 此脚本可以安全运行，不会影响现有功能
 */

const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');

async function addIndexes() {
  const t = await sequelize.transaction();
  
  try {
    console.log('开始添加数据库索引...');
    
    // 检查表结构
    await checkTableStructure('posts', t);
    await checkTableStructure('comments', t);
    await checkTableStructure('messages', t);
    await checkTableStructure('collections', t);
    await checkTableStructure('events', t);
    
    // 处理帖子表索引
    console.log('处理帖子表索引...');
    try {
      const postsColumns = await getTableColumns('posts', t);
      console.log('帖子表字段:', postsColumns.join(', '));
      
      // 查找用户ID字段 (可能是userId或user_id)
      const userIdField = findField(postsColumns, ['userId', 'user_id', 'uid']);
      
      // 查找创建时间字段 (可能是createdAt, create_time, created_time, createTime等)
      const createTimeField = findField(postsColumns, ['createdAt', 'createTime', 'create_time', 'created_time', 'created_at', 'createDate', 'create_date', 'date', 'time']);
      
      // 查找状态字段
      const statusField = findField(postsColumns, ['status', 'state', 'type']);
      
      // 查找分类ID字段
      const categoryField = findField(postsColumns, ['categoryId', 'category_id', 'cid', 'category']);
      
      // 查找推荐字段
      const recommendField = findField(postsColumns, ['isRecommended', 'is_recommended', 'recommended', 'is_top', 'isTop', 'top']);
      
      // 创建索引，确保字段存在
      if (userIdField && createTimeField) {
        await addIndexIfNotExists('posts', 'idx_posts_userid_created', `\`${userIdField}\`, \`${createTimeField}\``, t);
      }
      
      if (statusField && createTimeField) {
        await addIndexIfNotExists('posts', 'idx_posts_status_created', `\`${statusField}\`, \`${createTimeField}\``, t);
      }
      
      if (categoryField && createTimeField) {
        await addIndexIfNotExists('posts', 'idx_posts_category_created', `\`${categoryField}\`, \`${createTimeField}\``, t);
      }
      
      if (recommendField && createTimeField) {
        await addIndexIfNotExists('posts', 'idx_posts_recommend_created', `\`${recommendField}\`, \`${createTimeField}\``, t);
      }
    } catch (error) {
      console.warn('添加帖子表索引过程中出错:', error.message);
    }
    
    // 处理评论表索引
    console.log('处理评论表索引...');
    try {
      const commentsColumns = await getTableColumns('comments', t);
      console.log('评论表字段:', commentsColumns.join(', '));
      
      // 查找字段
      const postIdField = findField(commentsColumns, ['postId', 'post_id', 'pid']);
      const parentIdField = findField(commentsColumns, ['parentId', 'parent_id', 'parent']);
      const userIdField = findField(commentsColumns, ['userId', 'user_id', 'uid']);
      const createTimeField = findField(commentsColumns, ['createdAt', 'createTime', 'create_time', 'created_time', 'created_at', 'createDate', 'create_date', 'date', 'time']);
      const statusField = findField(commentsColumns, ['status', 'state', 'type']);
      
      // 创建索引
      if (postIdField && parentIdField) {
        await addIndexIfNotExists('comments', 'idx_comments_postid_parent', `\`${postIdField}\`, \`${parentIdField}\``, t);
      }
      
      if (userIdField && createTimeField) {
        await addIndexIfNotExists('comments', 'idx_comments_userid_created', `\`${userIdField}\`, \`${createTimeField}\``, t);
      }
      
      if (statusField) {
        await addIndexIfNotExists('comments', 'idx_comments_status', `\`${statusField}\``, t);
      }
    } catch (error) {
      console.warn('添加评论表索引过程中出错:', error.message);
    }
    
    // 处理消息表索引
    console.log('处理消息表索引...');
    try {
      const messagesColumns = await getTableColumns('messages', t);
      console.log('消息表字段:', messagesColumns.join(', '));
      
      // 查找字段
      const recipientIdField = findField(messagesColumns, ['recipientId', 'recipient_id', 'toUserId', 'to_user_id', 'receiver_id', 'receiverId']);
      const isReadField = findField(messagesColumns, ['isRead', 'is_read', 'read', 'read_status', 'readStatus']);
      const typeField = findField(messagesColumns, ['type', 'msg_type', 'message_type', 'messageType']);
      const createTimeField = findField(messagesColumns, ['createdAt', 'createTime', 'create_time', 'created_time', 'created_at', 'createDate', 'create_date', 'date', 'time']);
      
      // 创建索引
      if (recipientIdField && isReadField && createTimeField) {
        await addIndexIfNotExists('messages', 'idx_messages_recipient_read', `\`${recipientIdField}\`, \`${isReadField}\`, \`${createTimeField}\``, t);
      }
      
      if (typeField && createTimeField) {
        await addIndexIfNotExists('messages', 'idx_messages_type_created', `\`${typeField}\`, \`${createTimeField}\``, t);
      }
    } catch (error) {
      console.warn('添加消息表索引过程中出错:', error.message);
    }
    
    // 处理收藏表索引
    console.log('处理收藏表索引...');
    try {
      const collectionsColumns = await getTableColumns('collections', t);
      console.log('收藏表字段:', collectionsColumns.join(', '));
      
      // 查找字段
      const userIdField = findField(collectionsColumns, ['userId', 'user_id', 'uid']);
      const createTimeField = findField(collectionsColumns, ['createdAt', 'createTime', 'create_time', 'created_time', 'created_at', 'createDate', 'create_date', 'date', 'time']);
      
      // 创建索引
      if (userIdField && createTimeField) {
        await addIndexIfNotExists('collections', 'idx_collections_userid_created', `\`${userIdField}\`, \`${createTimeField}\``, t);
      }
    } catch (error) {
      console.warn('添加收藏表索引过程中出错:', error.message);
    }
    
    // 处理活动表索引
    console.log('处理活动表索引...');
    try {
      const eventsColumns = await getTableColumns('events', t);
      console.log('活动表字段:', eventsColumns.join(', '));
      
      // 查找字段
      const statusField = findField(eventsColumns, ['status', 'state', 'type']);
      const startTimeField = findField(eventsColumns, ['startTime', 'start_time', 'beginTime', 'begin_time', 'startDate', 'start_date']);
      const createTimeField = findField(eventsColumns, ['createdAt', 'createTime', 'create_time', 'created_time', 'created_at', 'createDate', 'create_date']);
      const creatorIdField = findField(eventsColumns, ['creatorId', 'creator_id', 'userId', 'user_id', 'organizer_id', 'organizerId']);
      
      // 创建索引
      if (statusField && startTimeField) {
        await addIndexIfNotExists('events', 'idx_events_status_start', `\`${statusField}\`, \`${startTimeField}\``, t);
      }
      
      if (creatorIdField && createTimeField) {
        await addIndexIfNotExists('events', 'idx_events_creator_created', `\`${creatorIdField}\`, \`${createTimeField}\``, t);
      }
      
      if (startTimeField) {
        await addIndexIfNotExists('events', 'idx_events_start_time', `\`${startTimeField}\``, t);
      }
    } catch (error) {
      console.warn('添加活动表索引过程中出错:', error.message);
    }
    
    await t.commit();
    console.log('索引添加成功！数据库性能已优化。');
    return true;
  } catch (error) {
    await t.rollback();
    console.error('添加索引失败:', error);
    // 即使添加索引失败，也不阻止应用启动
    return false;
  }
}

/**
 * 在可能的字段名列表中查找表中存在的字段
 * @param {string[]} columns 表中存在的列名
 * @param {string[]} possibleFields 可能的字段名列表
 * @returns {string|null} 找到的字段名，未找到则返回null
 */
function findField(columns, possibleFields) {
  for (const field of possibleFields) {
    if (columns.includes(field)) {
      return field;
    }
  }
  return null;
}

/**
 * 获取表中的所有字段名
 * @param {string} table 表名
 * @param {object} transaction 事务对象
 * @returns {Promise<string[]>} 字段名数组
 */
async function getTableColumns(table, transaction) {
  try {
    const database = sequelize.config.database;
    const columns = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      {
        replacements: [database, table],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    return columns.map(col => col.COLUMN_NAME);
  } catch (error) {
    console.error(`获取表 ${table} 字段失败:`, error);
    return [];
  }
}

/**
 * 检查表是否存在
 * @param {string} table 表名
 * @param {object} transaction 事务对象
 */
async function checkTableStructure(table, transaction) {
  const database = sequelize.config.database;
  const [result] = await sequelize.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    {
      replacements: [database, table],
      type: QueryTypes.SELECT,
      transaction
    }
  );
  
  if (result.count === 0) {
    console.warn(`表 ${table} 不存在，将跳过相关索引添加`);
  } else {
    try {
      // 打印表结构，帮助调试
      const describeSql = `DESCRIBE ${table}`;
      const [tableDesc] = await sequelize.query(describeSql, { transaction });
      console.log(`表 ${table} 结构:`, tableDesc.map(col => `${col.Field}(${col.Type})`).join(', '));
    } catch (error) {
      console.warn(`无法获取表 ${table} 的详细结构:`, error.message);
    }
  }
}

/**
 * 检查索引是否存在，不存在则添加
 * @param {string} table 表名
 * @param {string} indexName 索引名称
 * @param {string} columns 索引列
 * @param {object} transaction 事务对象
 */
async function addIndexIfNotExists(table, indexName, columns, transaction) {
  try {
    // 检查索引是否存在
    const database = sequelize.config.database;
    const [indexes] = await sequelize.query(
      `SELECT COUNT(*) as count FROM information_schema.statistics 
       WHERE table_schema = ? AND table_name = ? AND index_name = ?`,
      {
        replacements: [database, table, indexName],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    
    if (indexes.count === 0) {
      // 索引不存在，创建它
      console.log(`创建索引: ${indexName} 在表 ${table} 上 (${columns})`);
      await sequelize.query(
        `CREATE INDEX ${indexName} ON ${table}(${columns})`,
        { transaction }
      );
      console.log(`索引 ${indexName} 创建成功`);
    } else {
      console.log(`索引 ${indexName} 已存在，跳过`);
    }
  } catch (error) {
    console.error(`为表 ${table} 添加索引 ${indexName} 失败:`, error);
    throw error;
  }
}

// 如果直接运行此脚本则执行索引添加
if (require.main === module) {
  addIndexes()
    .then(success => {
      console.log(success ? '索引添加完成' : '索引添加失败');
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('执行出错:', err);
      process.exit(1);
    });
} else {
  // 作为模块导出
  module.exports = { addIndexes };
} 