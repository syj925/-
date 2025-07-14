'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 检查用户表是否存在
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('users')) {
        console.log('users表不存在，跳过迁移');
        return;
      }

      // 检查settings字段是否已经存在
      const tableDescription = await queryInterface.describeTable('users');
      if (tableDescription.settings) {
        console.log('settings字段已存在，跳过迁移');
        return;
      }

      // 添加settings字段
      await queryInterface.addColumn('users', 'settings', {
        type: Sequelize.JSON,
        defaultValue: {
          privacy: {
            anonymousMode: false,
            allowSearch: true,
            showLocation: false
          }
        },
        after: 'status' // 在status字段后添加
      });

      console.log('成功添加settings字段到users表');
    } catch (error) {
      console.error('迁移失败:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // 检查用户表是否存在
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('users')) {
        console.log('users表不存在，跳过回滚');
        return;
      }

      // 检查settings字段是否存在
      const tableDescription = await queryInterface.describeTable('users');
      if (!tableDescription.settings) {
        console.log('settings字段不存在，跳过回滚');
        return;
      }

      // 删除settings字段
      await queryInterface.removeColumn('users', 'settings');
      console.log('成功删除users表的settings字段');
    } catch (error) {
      console.error('回滚失败:', error);
      throw error;
    }
  }
}; 