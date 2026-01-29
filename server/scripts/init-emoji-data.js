const { sequelize, EmojiPack, Emoji } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

/**
 * 初始化表情数据
 * 创建基础表情包和常用表情
 */
async function initEmojiData() {
  try {
    console.log('开始初始化表情数据...');

    // 检查是否已有数据
    const existingPacks = await EmojiPack.count();
    if (existingPacks > 0) {
      console.log(`已存在 ${existingPacks} 个表情包，跳过初始化`);
      return;
    }

    // 创建基础表情包
    const systemPack = await EmojiPack.create({
      id: uuidv4(),
      name: '基础表情',
      description: '系统内置基础表情包',
      type: 'system',
      status: 'active',
      sort_order: 1,
      is_featured: true
    });

    console.log('✓ 创建表情包:', systemPack.name);

    // 基础表情数据（使用emoji unicode字符作为占位）
    const basicEmojis = [
      { name: '测试', code: '[测试]', emoji: '😊' },
      { name: '加油', code: '[加油]', emoji: '💪' },
      { name: '开心', code: '[开心]', emoji: '😄' },
      { name: '点赞', code: '[点赞]', emoji: '👍' },
      { name: '爱心', code: '[爱心]', emoji: '❤️' },
      { name: '笑哭', code: '[笑哭]', emoji: '😂' },
      { name: '思考', code: '[思考]', emoji: '🤔' },
      { name: '惊讶', code: '[惊讶]', emoji: '😮' },
      { name: '流汗', code: '[流汗]', emoji: '😅' },
      { name: '尴尬', code: '[尴尬]', emoji: '😓' },
      { name: '生气', code: '[生气]', emoji: '😠' },
      { name: '难过', code: '[难过]', emoji: '😢' },
      { name: '疑问', code: '[疑问]', emoji: '❓' },
      { name: '感叹', code: '[感叹]', emoji: '❗' },
      { name: '庆祝', code: '[庆祝]', emoji: '🎉' },
      { name: '比心', code: '[比心]', emoji: '🫶' },
      { name: '鼓掌', code: '[鼓掌]', emoji: '👏' },
      { name: '握手', code: '[握手]', emoji: '🤝' },
      { name: '祈祷', code: '[祈祷]', emoji: '🙏' },
      { name: '胜利', code: '[胜利]', emoji: '✌️' }
    ];

    // 批量创建表情（使用emoji unicode作为临时图片URL）
    const emojiPromises = basicEmojis.map((item, index) => {
      return Emoji.create({
        id: uuidv4(),
        pack_id: systemPack.id,
        code: item.code,
        name: item.name,
        keywords: item.name,
        // 使用data URL格式存储emoji字符作为图片
        url: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><text x="16" y="48" font-size="48">${item.emoji}</text></svg>`,
        thumbnail_url: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text x="8" y="24" font-size="24">${item.emoji}</text></svg>`,
        type: 'static',
        width: 64,
        height: 64,
        status: 'active',
        sort_order: index + 1,
        use_count: 0
      });
    });

    await Promise.all(emojiPromises);

    console.log(`✓ 创建 ${basicEmojis.length} 个基础表情`);
    console.log('\n表情数据初始化完成！');
    console.log(`表情包: ${systemPack.name}`);
    console.log(`表情数量: ${basicEmojis.length}`);
    console.log('\n可用表情code示例:');
    basicEmojis.slice(0, 5).forEach(item => {
      console.log(`  ${item.code} - ${item.emoji} ${item.name}`);
    });

  } catch (error) {
    console.error('初始化表情数据失败:', error);
    throw error;
  }
}

// 执行初始化
initEmojiData()
  .then(() => {
    console.log('\n✅ 初始化成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 初始化失败:', error);
    process.exit(1);
  });
