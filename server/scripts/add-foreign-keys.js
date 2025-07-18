/**
 * 添加外键约束脚本
 * 在表创建完成后，手动添加外键约束
 */

const { Sequelize } = require('sequelize');
const projectConfig = require('../config');

console.log('🔗 添加数据库外键约束');
console.log('====================');

async function addForeignKeys() {
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
    
    // 定义外键约束
    const foreignKeys = [
      // posts表的外键
      {
        table: 'posts',
        column: 'user_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'posts',
        column: 'category_id',
        references: { table: 'categories', column: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      
      // comments表的外键
      {
        table: 'comments',
        column: 'user_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'comments',
        column: 'post_id',
        references: { table: 'posts', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'comments',
        column: 'parent_id',
        references: { table: 'comments', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      
      // likes表的外键
      {
        table: 'likes',
        column: 'user_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'likes',
        column: 'post_id',
        references: { table: 'posts', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'likes',
        column: 'comment_id',
        references: { table: 'comments', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      
      // favorites表的外键
      {
        table: 'favorites',
        column: 'user_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'favorites',
        column: 'post_id',
        references: { table: 'posts', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      
      // follows表的外键
      {
        table: 'follows',
        column: 'follower_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'follows',
        column: 'following_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      
      // search_histories表的外键
      {
        table: 'search_histories',
        column: 'user_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      
      // post_images表的外键
      {
        table: 'post_images',
        column: 'post_id',
        references: { table: 'posts', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      
      // messages表的外键
      {
        table: 'messages',
        column: 'sender_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      {
        table: 'messages',
        column: 'receiver_id',
        references: { table: 'users', column: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
      
      // 注意：topics表的created_by字段类型需要先修复为UUID
      // {
      //   table: 'topics',
      //   column: 'created_by',
      //   references: { table: 'users', column: 'id' },
      //   onDelete: 'SET NULL',
      //   onUpdate: 'CASCADE'
      // }
    ];
    
    console.log('🔗 开始添加外键约束...');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const fk of foreignKeys) {
      try {
        const constraintName = `fk_${fk.table}_${fk.column}`;
        
        // 检查约束是否已存在
        const [existing] = await sequelize.query(`
          SELECT CONSTRAINT_NAME 
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = '${projectConfig.database.database}' 
          AND TABLE_NAME = '${fk.table}' 
          AND COLUMN_NAME = '${fk.column}'
          AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        
        if (existing.length > 0) {
          console.log(`   ⚠️ ${fk.table}.${fk.column} 外键约束已存在，跳过`);
          skipCount++;
          continue;
        }
        
        // 添加外键约束
        await sequelize.query(`
          ALTER TABLE \`${fk.table}\` 
          ADD CONSTRAINT \`${constraintName}\` 
          FOREIGN KEY (\`${fk.column}\`) 
          REFERENCES \`${fk.references.table}\` (\`${fk.references.column}\`)
          ON DELETE ${fk.onDelete} 
          ON UPDATE ${fk.onUpdate}
        `);
        
        console.log(`   ✅ ${fk.table}.${fk.column} → ${fk.references.table}.${fk.references.column}`);
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ ${fk.table}.${fk.column}: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('🎉 外键约束添加完成！');
    console.log(`   ✅ 成功: ${successCount} 个`);
    console.log(`   ⚠️ 跳过: ${skipCount} 个`);
    console.log('');
    console.log('💡 注意事项:');
    console.log('   - topics表的created_by字段需要先修复类型为UUID');
    console.log('   - 如有数据不一致，需要先清理数据');
    console.log('');
    
  } catch (error) {
    console.error('❌ 添加外键约束失败:', error.message);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

addForeignKeys();
