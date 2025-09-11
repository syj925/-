const { Setting } = require('../models');

/**
 * 初始化私信功能相关的系统设置
 */
async function initPrivateMessageSettings() {
  console.log('🔧 开始初始化私信功能系统设置...');

  try {
    // 1. 检查全局私信功能开关是否存在
    const existingSetting = await Setting.findOne({
      where: { key: 'private_message_enabled' }
    });

    if (!existingSetting) {
      // 创建全局私信功能开关设置
      await Setting.create({
        key: 'private_message_enabled',
        value: 'true',
        description: '全局私信功能开关：控制整个应用是否启用私信功能',
        type: 'boolean',
        is_system: true
      });

      console.log('✅ 已创建全局私信功能开关设置，默认启用');
    } else {
      console.log('⚠️ 全局私信功能开关设置已存在，当前值:', existingSetting.value);
    }

    // 2. 可以在这里添加其他私信相关的系统设置
    // 例如：私信内容长度限制、私信发送频率限制等

    const contentLimitSetting = await Setting.findOne({
      where: { key: 'private_message_content_max_length' }
    });

    if (!contentLimitSetting) {
      await Setting.create({
        key: 'private_message_content_max_length',
        value: '2000',
        description: '私信内容最大长度限制（字符数）',
        type: 'number',
        is_system: true
      });

      console.log('✅ 已创建私信内容长度限制设置，默认2000字符');
    } else {
      console.log('⚠️ 私信内容长度限制设置已存在，当前值:', contentLimitSetting.value);
    }

    const rateLimitSetting = await Setting.findOne({
      where: { key: 'private_message_rate_limit_per_minute' }
    });

    if (!rateLimitSetting) {
      await Setting.create({
        key: 'private_message_rate_limit_per_minute',
        value: '10',
        description: '私信发送频率限制（每分钟最多发送条数）',
        type: 'number',
        is_system: true
      });

      console.log('✅ 已创建私信发送频率限制设置，默认每分钟10条');
    } else {
      console.log('⚠️ 私信发送频率限制设置已存在，当前值:', rateLimitSetting.value);
    }

    console.log('🎉 私信功能系统设置初始化完成！');

  } catch (error) {
    console.error('❌ 初始化私信功能系统设置失败:', error);
    throw error;
  }
}

/**
 * 获取私信功能相关的系统设置
 */
async function getPrivateMessageSettings() {
  try {
    const settings = await Setting.findAll({
      where: {
        key: [
          'private_message_enabled',
          'private_message_content_max_length',
          'private_message_rate_limit_per_minute'
        ]
      }
    });

    const settingsMap = {};
    settings.forEach(setting => {
      let value = setting.value;
      
      // 根据类型转换值
      if (setting.type === 'boolean') {
        value = value === 'true' || value === true;
      } else if (setting.type === 'number') {
        value = parseInt(value, 10);
      }
      
      settingsMap[setting.key] = value;
    });

    return settingsMap;
  } catch (error) {
    console.error('获取私信功能设置失败:', error);
    return {
      private_message_enabled: true, // 默认启用
      private_message_content_max_length: 2000,
      private_message_rate_limit_per_minute: 10
    };
  }
}

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
  const { sequelize } = require('../models');
  
  sequelize.authenticate()
    .then(() => {
      console.log('✅ 数据库连接成功');
      return initPrivateMessageSettings();
    })
    .then(() => {
      console.log('🏁 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = {
  initPrivateMessageSettings,
  getPrivateMessageSettings
};











