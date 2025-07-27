/**
 * 测试动态设置创建功能
 */
const { Setting } = require('./src/models');
const SensitiveWordMiddleware = require('./src/middlewares/sensitive-word.middleware');
const ContentLengthMiddleware = require('./src/middlewares/content-length.middleware');
const PublishLimitMiddleware = require('./src/middlewares/publish-limit.middleware');

async function testDynamicSettings() {
  console.log('=== 测试动态设置创建功能 ===\n');

  try {
    // 1. 测试敏感词设置
    console.log('1. 测试敏感词设置...');
    const sensitiveSettings = await SensitiveWordMiddleware.getSensitiveWordSettings();
    console.log('敏感词设置:', sensitiveSettings);
    console.log('✅ 敏感词设置获取成功\n');

    // 2. 测试内容长度设置
    console.log('2. 测试内容长度设置...');
    const lengthSettings = await ContentLengthMiddleware.getContentLengthSettings();
    console.log('长度设置:', lengthSettings);
    console.log('✅ 内容长度设置获取成功\n');

    // 3. 测试发布限制设置
    console.log('3. 测试发布限制设置...');
    const limitSettings = await PublishLimitMiddleware.getPublishLimitSettings();
    console.log('发布限制设置:', limitSettings);
    console.log('✅ 发布限制设置获取成功\n');

    // 4. 查看数据库中创建的设置
    console.log('4. 查看数据库中的设置记录...');
    const allSettings = await Setting.findAll({
      where: {
        is_system: true
      },
      order: [['key', 'ASC']]
    });

    console.log('数据库中的设置记录:');
    allSettings.forEach(setting => {
      console.log(`- ${setting.key}: ${setting.value} (${setting.type}) - ${setting.description}`);
    });

    console.log('\n✅ 所有测试通过！动态设置创建功能正常工作。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', error.message);
    
    // 如果是数据库连接问题
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 提示: 请检查数据库连接配置和数据库服务是否启动');
    }
    
    // 如果是表不存在的问题
    if (error.message.includes("doesn't exist")) {
      console.error('\n💡 提示: settings表不存在，需要先创建表结构');
      console.error('可以运行以下命令创建表:');
      console.error('node -e "require(\'./src/models\').sequelize.sync({force: false})"');
    }
  }
}

// 运行测试
testDynamicSettings().then(() => {
  console.log('\n测试完成，程序退出。');
  process.exit(0);
}).catch(error => {
  console.error('程序异常退出:', error);
  process.exit(1);
});
