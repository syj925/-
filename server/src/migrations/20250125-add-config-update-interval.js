'use strict';

/**
 * 添加配置更新间隔设置
 * 修复管理后台设置保存问题
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 检查设置是否已存在
      const [results] = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM settings WHERE `key` = 'configUpdateInterval'"
      );
      
      if (results[0].count > 0) {
        console.log('configUpdateInterval 设置已存在，跳过添加');
        return;
      }

      // 插入配置更新间隔设置
      await queryInterface.bulkInsert('settings', [
        {
          key: 'configUpdateInterval',
          value: '5',
          description: '前端App配置更新检查间隔（分钟）',
          type: 'number',
          is_system: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      console.log('✅ 成功添加 configUpdateInterval 设置');
    } catch (error) {
      console.error('❌ 添加 configUpdateInterval 设置失败:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('settings', {
        key: 'configUpdateInterval'
      });
      console.log('✅ 成功删除 configUpdateInterval 设置');
    } catch (error) {
      console.error('❌ 删除 configUpdateInterval 设置失败:', error);
      throw error;
    }
  }
};
