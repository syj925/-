'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 检查表是否存在
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('comments')) {
      console.log('comments表不存在，跳过迁移');
      return Promise.resolve();
    }

    // 检查列是否已存在
    const tableInfo = await queryInterface.describeTable('comments');
    if (tableInfo.isAnonymous) {
      console.log('isAnonymous列已存在，跳过迁移');
      return Promise.resolve();
    }

    // 添加isAnonymous字段
    return queryInterface.addColumn('comments', 'isAnonymous', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      after: 'status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 检查表和列是否存在
    try {
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('comments')) {
        console.log('comments表不存在，跳过回滚');
        return Promise.resolve();
      }

      const tableInfo = await queryInterface.describeTable('comments');
      if (!tableInfo.isAnonymous) {
        console.log('isAnonymous列不存在，跳过回滚');
        return Promise.resolve();
      }

      // 移除isAnonymous字段
      return queryInterface.removeColumn('comments', 'isAnonymous');
    } catch (error) {
      console.error('回滚失败:', error);
      return Promise.reject(error);
    }
  }
}; 