'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('开始执行迁移：初始化私信功能系统设置...');
    
    try {
      // 插入私信功能相关的系统设置
      await queryInterface.bulkInsert('settings', [
        {
          key: 'private_message_enabled',
          value: 'true',
          description: '全局私信功能开关：控制整个应用是否启用私信功能',
          type: 'boolean',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          key: 'private_message_content_max_length',
          value: '2000',
          description: '私信内容最大长度限制（字符数）',
          type: 'number',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          key: 'private_message_rate_limit_per_minute',
          value: '10',
          description: '私信发送频率限制（每分钟最多发送条数）',
          type: 'number',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {
        ignoreDuplicates: true  // 如果已存在相同key则忽略
      });
      
      console.log('✅ 成功初始化私信功能系统设置');
      
    } catch (error) {
      console.error('❌ 初始化私信功能系统设置失败:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('开始回滚迁移：删除私信功能系统设置...');
    
    try {
      // 删除私信功能相关的系统设置
      await queryInterface.bulkDelete('settings', {
        key: {
          [Sequelize.Op.in]: [
            'private_message_enabled',
            'private_message_content_max_length',
            'private_message_rate_limit_per_minute'
          ]
        }
      });
      
      console.log('✅ 成功删除私信功能系统设置');
      
    } catch (error) {
      console.error('❌ 删除私信功能系统设置失败:', error);
      throw error;
    }
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('开始执行迁移：初始化私信功能系统设置...');
    
    try {
      // 插入私信功能相关的系统设置
      await queryInterface.bulkInsert('settings', [
        {
          key: 'private_message_enabled',
          value: 'true',
          description: '全局私信功能开关：控制整个应用是否启用私信功能',
          type: 'boolean',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          key: 'private_message_content_max_length',
          value: '2000',
          description: '私信内容最大长度限制（字符数）',
          type: 'number',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          key: 'private_message_rate_limit_per_minute',
          value: '10',
          description: '私信发送频率限制（每分钟最多发送条数）',
          type: 'number',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {
        ignoreDuplicates: true  // 如果已存在相同key则忽略
      });
      
      console.log('✅ 成功初始化私信功能系统设置');
      
    } catch (error) {
      console.error('❌ 初始化私信功能系统设置失败:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('开始回滚迁移：删除私信功能系统设置...');
    
    try {
      // 删除私信功能相关的系统设置
      await queryInterface.bulkDelete('settings', {
        key: {
          [Sequelize.Op.in]: [
            'private_message_enabled',
            'private_message_content_max_length',
            'private_message_rate_limit_per_minute'
          ]
        }
      });
      
      console.log('✅ 成功删除私信功能系统设置');
      
    } catch (error) {
      console.error('❌ 删除私信功能系统设置失败:', error);
      throw error;
    }
  }
};
