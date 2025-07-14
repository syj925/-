'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 检查列是否已存在
      const tableInfo = await queryInterface.describeTable('user_badges');
      
      if (!tableInfo.deleted_at) {
        // 添加deleted_at列
        await queryInterface.addColumn('user_badges', 'deleted_at', {
          type: Sequelize.DATE,
          allowNull: true
        });
        console.log('已添加deleted_at列到user_badges表');
      } else {
        console.log('deleted_at列已存在于user_badges表中');
      }
    } catch (error) {
      console.error('迁移失败:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // 删除列
      await queryInterface.removeColumn('user_badges', 'deleted_at');
      console.log('已从user_badges表中删除deleted_at列');
    } catch (error) {
      console.error('回滚失败:', error);
      throw error;
    }
  }
}; 