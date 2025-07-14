'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('events', 'detail_images', {
      type: Sequelize.TEXT, 
      allowNull: true
    });

    await queryInterface.addColumn('events', 'notices', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('events', 'detail_images');
    await queryInterface.removeColumn('events', 'notices');
  }
};
