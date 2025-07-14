'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notification_recipients', 'status', {
      type: Sequelize.ENUM('delivered', 'read', 'archived'),
      allowNull: false,
      defaultValue: 'delivered',
      after: 'read_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('notification_recipients', 'status');
  }
}; 