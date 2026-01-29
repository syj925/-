'use strict';

/**
 * 表情系统数据库迁移脚本
 * 单独运行: node src/migrations/20250121-create-emoji-tables.js
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// 加载配置
const configPath = path.join(__dirname, '../../config/config.json');
const allConfig = require(configPath);
const env = process.env.NODE_ENV || 'development';
const config = allConfig[env];

// 创建数据库连接
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: console.log
});

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('开始创建表情系统相关表...\n');

  // 1. 创建 emoji_packs 表情包表
  console.log('1. 创建 emoji_packs 表...');
  await queryInterface.createTable('emoji_packs', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING(50),
      allowNull: false,
      comment: '表情包名称'
    },
    description: {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: '表情包描述'
    },
    cover_url: {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: '封面图URL'
    },
    type: {
      type: Sequelize.ENUM('system', 'official', 'user', 'store'),
      allowNull: false,
      defaultValue: 'official',
      comment: 'system:系统内置 official:官方 user:用户创建 store:商店'
    },
    author_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: '创建者ID'
    },
    price: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '价格(0为免费)'
    },
    is_featured: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否精选推荐'
    },
    download_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '下载次数'
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive', 'pending', 'rejected'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '版本号'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  // 添加索引
  await queryInterface.addIndex('emoji_packs', ['type', 'status']);
  await queryInterface.addIndex('emoji_packs', ['author_id']);
  await queryInterface.addIndex('emoji_packs', ['is_featured', 'sort_order']);
  await queryInterface.addIndex('emoji_packs', ['status', 'sort_order']);
  console.log('   ✓ emoji_packs 表创建完成\n');

  // 2. 创建 emojis 表情表
  console.log('2. 创建 emojis 表...');
  await queryInterface.createTable('emojis', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    pack_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'emoji_packs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '所属表情包ID'
    },
    name: {
      type: Sequelize.STRING(50),
      allowNull: false,
      comment: '表情名称'
    },
    code: {
      type: Sequelize.STRING(50),
      allowNull: false,
      comment: '表情代码，如[微笑]'
    },
    keywords: {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: '搜索关键字，逗号分隔'
    },
    url: {
      type: Sequelize.STRING(500),
      allowNull: false,
      comment: '表情图片URL'
    },
    thumbnail_url: {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: '缩略图URL'
    },
    type: {
      type: Sequelize.ENUM('static', 'animated'),
      allowNull: false,
      defaultValue: 'static',
      comment: 'static:静态图 animated:动图'
    },
    width: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '宽度(px)'
    },
    height: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '高度(px)'
    },
    file_size: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '文件大小(bytes)'
    },
    use_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '使用次数'
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  // 添加索引
  await queryInterface.addIndex('emojis', ['pack_id', 'status']);
  await queryInterface.addIndex('emojis', ['code'], { unique: true });
  await queryInterface.addIndex('emojis', ['use_count']);
  await queryInterface.addIndex('emojis', ['sort_order']);
  console.log('   ✓ emojis 表创建完成\n');

  // 3. 创建 user_emoji_packs 用户表情包关联表
  console.log('3. 创建 user_emoji_packs 表...');
  await queryInterface.createTable('user_emoji_packs', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    pack_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'emoji_packs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    source: {
      type: Sequelize.ENUM('default', 'download', 'purchase', 'gift'),
      allowNull: false,
      defaultValue: 'download',
      comment: 'default:默认 download:下载 purchase:购买 gift:赠送'
    },
    sort_order: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '用户自定义排序'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  // 添加索引
  await queryInterface.addIndex('user_emoji_packs', ['user_id', 'pack_id'], { unique: true });
  await queryInterface.addIndex('user_emoji_packs', ['user_id', 'sort_order']);
  console.log('   ✓ user_emoji_packs 表创建完成\n');

  // 4. 创建 emoji_favorites 收藏表
  console.log('4. 创建 emoji_favorites 表...');
  await queryInterface.createTable('emoji_favorites', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    emoji_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'emojis',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  // 添加索引
  await queryInterface.addIndex('emoji_favorites', ['user_id', 'emoji_id'], { unique: true });
  await queryInterface.addIndex('emoji_favorites', ['user_id']);
  console.log('   ✓ emoji_favorites 表创建完成\n');

  // 5. 创建 emoji_usage_history 使用记录表
  console.log('5. 创建 emoji_usage_history 表...');
  await queryInterface.createTable('emoji_usage_history', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    emoji_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'emojis',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    usage_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '使用次数'
    },
    last_used_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      comment: '最后使用时间'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  // 添加索引
  await queryInterface.addIndex('emoji_usage_history', ['user_id', 'emoji_id'], { unique: true });
  await queryInterface.addIndex('emoji_usage_history', ['user_id', 'last_used_at']);
  await queryInterface.addIndex('emoji_usage_history', ['user_id', 'usage_count']);
  console.log('   ✓ emoji_usage_history 表创建完成\n');

  // 6. 创建 user_custom_emojis 用户自定义表情表
  console.log('6. 创建 user_custom_emojis 表...');
  await queryInterface.createTable('user_custom_emojis', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '上传用户ID'
    },
    name: {
      type: Sequelize.STRING(50),
      allowNull: false,
      comment: '表情名称'
    },
    url: {
      type: Sequelize.STRING(500),
      allowNull: false,
      comment: '图片URL'
    },
    thumbnail_url: {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: '缩略图URL'
    },
    type: {
      type: Sequelize.ENUM('static', 'animated'),
      allowNull: false,
      defaultValue: 'static',
      comment: '类型'
    },
    width: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '宽度'
    },
    height: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '高度'
    },
    file_size: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '文件大小'
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '审核状态'
    },
    reviewer_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: '审核人ID'
    },
    reviewed_at: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '审核时间'
    },
    reject_reason: {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: '拒绝原因'
    },
    emoji_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'emojis',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: '审核通过后关联的正式表情ID'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  // 添加索引
  await queryInterface.addIndex('user_custom_emojis', ['user_id', 'status']);
  await queryInterface.addIndex('user_custom_emojis', ['status', 'created_at']);
  await queryInterface.addIndex('user_custom_emojis', ['reviewer_id']);
  console.log('   ✓ user_custom_emojis 表创建完成\n');

  // 7. 创建 emoji_versions 版本记录表
  console.log('7. 创建 emoji_versions 表...');
  await queryInterface.createTable('emoji_versions', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '版本号'
    },
    change_type: {
      type: Sequelize.ENUM('add', 'update', 'delete', 'full'),
      allowNull: false,
      comment: '变更类型'
    },
    change_data: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: '变更数据'
    },
    description: {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: '版本描述'
    },
    published_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: '发布人'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  // 添加索引
  await queryInterface.addIndex('emoji_versions', ['version'], { unique: true });
  await queryInterface.addIndex('emoji_versions', ['created_at']);
  console.log('   ✓ emoji_versions 表创建完成\n');

  console.log('========================================');
  console.log('✅ 所有表情系统表创建完成！');
  console.log('========================================');
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('开始删除表情系统相关表...\n');

  // 按依赖顺序反向删除
  const tables = [
    'emoji_versions',
    'user_custom_emojis',
    'emoji_usage_history',
    'emoji_favorites',
    'user_emoji_packs',
    'emojis',
    'emoji_packs'
  ];

  for (const table of tables) {
    try {
      await queryInterface.dropTable(table);
      console.log(`   ✓ ${table} 表已删除`);
    } catch (error) {
      console.log(`   ✗ ${table} 表删除失败: ${error.message}`);
    }
  }

  console.log('\n✅ 表情系统表删除完成');
}

// 命令行参数处理
const args = process.argv.slice(2);
const action = args[0] || 'up';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功\n');

    if (action === 'down') {
      await down();
    } else {
      await up();
    }

    process.exit(0);
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

run();

// 也导出供 sequelize-cli 使用
module.exports = { up, down };
