/**
 * 安全添加内容管理所需的数据库字段
 * 专门为管理后台内容管理功能添加必要字段
 */

const { Sequelize } = require('sequelize');
const projectConfig = require('../config');

console.log('🔧 添加内容管理所需的数据库字段');
console.log('=====================================');

async function addContentManagementFields() {
  let sequelize;
  
  try {
    // 连接数据库
    console.log('🔌 连接数据库...');
    sequelize = new Sequelize(
      projectConfig.database.database,
      projectConfig.database.username,
      projectConfig.database.password,
      {
        ...projectConfig.database,
        logging: false
      }
    );
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 检查字段是否已存在的函数
    const checkColumnExists = async (tableName, columnName) => {
      try {
        const result = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_schema = '${projectConfig.database.database}' 
          AND table_name = '${tableName}' 
          AND column_name = '${columnName}'
        `, { type: sequelize.QueryTypes.SELECT });
        return result[0].count > 0;
      } catch (error) {
        console.warn(`检查字段 ${tableName}.${columnName} 时出错:`, error.message);
        return false;
      }
    };

    // 检查枚举值是否存在的函数
    const checkEnumValue = async (tableName, columnName, enumValue) => {
      try {
        const result = await sequelize.query(`
          SELECT COLUMN_TYPE 
          FROM information_schema.columns 
          WHERE table_schema = '${projectConfig.database.database}' 
          AND table_name = '${tableName}' 
          AND column_name = '${columnName}'
        `, { type: sequelize.QueryTypes.SELECT });
        
        if (result.length > 0) {
          const columnType = result[0].COLUMN_TYPE;
          return columnType.includes(`'${enumValue}'`);
        }
        return false;
      } catch (error) {
        console.warn(`检查枚举值 ${tableName}.${columnName}.${enumValue} 时出错:`, error.message);
        return false;
      }
    };

    console.log('');
    console.log('📋 开始添加字段...');
    console.log('');

    // 1. 为posts表添加is_recommended字段
    console.log('1️⃣ 检查posts表的is_recommended字段...');
    const hasIsRecommended = await checkColumnExists('posts', 'is_recommended');
    
    if (!hasIsRecommended) {
      console.log('   ➕ 添加is_recommended字段...');
      await sequelize.query(`
        ALTER TABLE posts 
        ADD COLUMN is_recommended BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT '是否推荐'
      `);
      console.log('   ✅ is_recommended字段添加成功');
    } else {
      console.log('   ✅ is_recommended字段已存在');
    }

    // 2. 扩展posts表的status枚举值
    console.log('');
    console.log('2️⃣ 检查posts表的status枚举值...');
    
    const statusEnumValues = ['pending', 'pinned', 'rejected'];
    let needUpdatePostsStatus = false;
    
    for (const enumValue of statusEnumValues) {
      const hasEnumValue = await checkEnumValue('posts', 'status', enumValue);
      if (!hasEnumValue) {
        console.log(`   ❌ 缺少枚举值: ${enumValue}`);
        needUpdatePostsStatus = true;
      } else {
        console.log(`   ✅ 枚举值已存在: ${enumValue}`);
      }
    }
    
    if (needUpdatePostsStatus) {
      console.log('   🔄 更新posts表status枚举值...');
      await sequelize.query(`
        ALTER TABLE posts 
        MODIFY COLUMN status ENUM('published', 'draft', 'deleted', 'pending', 'pinned', 'rejected') 
        NOT NULL DEFAULT 'published' 
        COMMENT 'published: 已发布, draft: 草稿, deleted: 已删除, pending: 待审核, pinned: 置顶, rejected: 已拒绝'
      `);
      console.log('   ✅ posts表status枚举值更新成功');
    } else {
      console.log('   ✅ posts表status枚举值已完整');
    }

    // 3. 扩展comments表的status枚举值
    console.log('');
    console.log('3️⃣ 检查comments表的status枚举值...');
    
    const commentStatusEnumValues = ['pending', 'rejected'];
    let needUpdateCommentsStatus = false;
    
    for (const enumValue of commentStatusEnumValues) {
      const hasEnumValue = await checkEnumValue('comments', 'status', enumValue);
      if (!hasEnumValue) {
        console.log(`   ❌ 缺少枚举值: ${enumValue}`);
        needUpdateCommentsStatus = true;
      } else {
        console.log(`   ✅ 枚举值已存在: ${enumValue}`);
      }
    }
    
    if (needUpdateCommentsStatus) {
      console.log('   🔄 更新comments表status枚举值...');
      await sequelize.query(`
        ALTER TABLE comments 
        MODIFY COLUMN status ENUM('normal', 'deleted', 'pending', 'rejected') 
        NOT NULL DEFAULT 'normal' 
        COMMENT 'normal: 正常, deleted: 已删除, pending: 待审核, rejected: 已拒绝'
      `);
      console.log('   ✅ comments表status枚举值更新成功');
    } else {
      console.log('   ✅ comments表status枚举值已完整');
    }

    // 4. 验证所有更改
    console.log('');
    console.log('🔍 验证所有更改...');
    
    // 验证posts表
    const postsColumns = await sequelize.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM information_schema.columns 
      WHERE table_schema = '${projectConfig.database.database}' 
      AND table_name = 'posts' 
      AND COLUMN_NAME IN ('is_recommended', 'status')
      ORDER BY COLUMN_NAME
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('   📋 posts表相关字段：');
    postsColumns.forEach(col => {
      console.log(`      ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (默认: ${col.COLUMN_DEFAULT}) - ${col.COLUMN_COMMENT}`);
    });
    
    // 验证comments表
    const commentsColumns = await sequelize.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM information_schema.columns 
      WHERE table_schema = '${projectConfig.database.database}' 
      AND table_name = 'comments' 
      AND COLUMN_NAME = 'status'
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('   📋 comments表相关字段：');
    commentsColumns.forEach(col => {
      console.log(`      ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (默认: ${col.COLUMN_DEFAULT}) - ${col.COLUMN_COMMENT}`);
    });

    console.log('');
    console.log('🎉 内容管理字段添加完成！');
    console.log('');
    console.log('📝 已添加/更新的字段：');
    console.log('   ✅ posts.is_recommended - 帖子推荐标记');
    console.log('   ✅ posts.status - 扩展状态枚举（pending, pinned, rejected）');
    console.log('   ✅ comments.status - 扩展状态枚举（pending, rejected）');
    console.log('');
    console.log('🚀 现在可以重启服务器测试管理后台内容管理功能了！');
    console.log('');
    
  } catch (error) {
    console.error('❌ 添加字段失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

addContentManagementFields();
