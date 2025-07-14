'use strict';

module.exports = {
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('event_registrations', 'form_data', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '用户填写的自定义表单数据'
    });
    
    // 修改registration_info的注释
    await queryInterface.changeColumn('event_registrations', 'registration_info', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: '基本注册信息，如姓名、电话等'
    });
  },

  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('event_registrations', 'form_data');
    
    // 恢复原来的注释
    await queryInterface.changeColumn('event_registrations', 'registration_info', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: '注册信息，包含姓名、联系方式等'
    });
  }
}; 