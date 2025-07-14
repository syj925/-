'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 添加 pending_image 列
    await queryInterface.addColumn('topics', 'pending_image', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'cover_image'
    });
    
    // 添加 image_status 列
    await queryInterface.addColumn('topics', 'image_status', {
      type: Sequelize.ENUM('default', 'pending', 'approved', 'rejected'),
      defaultValue: 'default',
      allowNull: false,
      after: 'pending_image'
    });
  },

  async down (queryInterface, Sequelize) {
    // 回滚：删除列
    await queryInterface.removeColumn('topics', 'pending_image');
    await queryInterface.removeColumn('topics', 'image_status');
  }
};
