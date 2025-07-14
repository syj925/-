'use strict';

module.exports = {
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('events', 'registration_fields', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '报名需填写的字段配置'
    });
    
    await queryInterface.addColumn('events', 'allow_cancel_registration', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      comment: '是否允许取消报名'
    });
    
    await queryInterface.addColumn('events', 'registration_deadline', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '报名截止日期'
    });
  },

  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('events', 'registration_fields');
    await queryInterface.removeColumn('events', 'allow_cancel_registration');
    await queryInterface.removeColumn('events', 'registration_deadline');
  }
}; 