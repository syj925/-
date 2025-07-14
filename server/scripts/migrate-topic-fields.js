const { sequelize } = require('../src/models');

/**
 * 为topics表添加新字段的迁移脚本
 */
async function migrateTopicFields() {
  try {
    console.log('开始为topics表添加新字段...');

    // 获取当前表结构
    const tableInfo = await sequelize.getQueryInterface().describeTable('topics');
    console.log('当前topics表字段:', Object.keys(tableInfo));

    // 需要添加的字段
    const fieldsToAdd = [
      {
        name: 'description',
        definition: {
          type: sequelize.Sequelize.TEXT,
          allowNull: true,
          comment: '话题描述'
        }
      },
      {
        name: 'cover_image',
        definition: {
          type: sequelize.Sequelize.STRING(255),
          allowNull: true,
          comment: '话题封面图片'
        }
      },
      {
        name: 'view_count',
        definition: {
          type: sequelize.Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: '浏览次数'
        }
      },
      {
        name: 'hot_score',
        definition: {
          type: sequelize.Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0,
          comment: '热度分数'
        }
      },
      {
        name: 'status',
        definition: {
          type: sequelize.Sequelize.ENUM('active', 'hidden', 'deleted'),
          allowNull: false,
          defaultValue: 'active',
          comment: '话题状态'
        }
      }
    ];

    // 检查并添加字段
    for (const field of fieldsToAdd) {
      if (!tableInfo[field.name]) {
        console.log(`添加字段: ${field.name}`);
        await sequelize.getQueryInterface().addColumn('topics', field.name, field.definition);
        console.log(`✅ 字段 ${field.name} 添加成功`);
      } else {
        console.log(`⚠️ 字段 ${field.name} 已存在，跳过`);
      }
    }

    // 添加索引
    const indexesToAdd = [
      {
        name: 'idx_topics_status',
        fields: ['status']
      },
      {
        name: 'idx_topics_hot_score',
        fields: ['hot_score']
      },
      {
        name: 'idx_topics_view_count',
        fields: ['view_count']
      }
    ];

    console.log('\n添加索引...');
    for (const index of indexesToAdd) {
      try {
        await sequelize.getQueryInterface().addIndex('topics', index.fields, {
          name: index.name
        });
        console.log(`✅ 索引 ${index.name} 添加成功`);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`⚠️ 索引 ${index.name} 已存在，跳过`);
        } else {
          console.error(`❌ 添加索引 ${index.name} 失败:`, error.message);
        }
      }
    }

    // 验证表结构
    const updatedTableInfo = await sequelize.getQueryInterface().describeTable('topics');
    console.log('\n更新后的topics表字段:', Object.keys(updatedTableInfo));

    console.log('\n🎉 topics表字段迁移完成！');
    console.log('现在可以运行 init-topic-data.js 来创建测试数据');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await migrateTopicFields();
    process.exit(0);
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { migrateTopicFields };
