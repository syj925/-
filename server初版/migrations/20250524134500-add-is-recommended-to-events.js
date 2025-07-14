'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * 添加isRecommended字段到events表，用于标记推荐活动
     */
    try {
      console.log('正在添加isRecommended字段到events表...');
      
      await queryInterface.addColumn('events', 'is_recommended', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        after: 'status'  // 放在status字段后面
      });
      
      console.log('isRecommended字段添加成功!');
      return Promise.resolve();
    } catch (error) {
      console.error('添加isRecommended字段失败:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * 移除isRecommended字段
     */
    try {
      console.log('正在从events表移除isRecommended字段...');
      
      await queryInterface.removeColumn('events', 'is_recommended');
      
      console.log('isRecommended字段移除成功!');
      return Promise.resolve();
    } catch (error) {
      console.error('移除isRecommended字段失败:', error);
      return Promise.reject(error);
    }
  }
}; 