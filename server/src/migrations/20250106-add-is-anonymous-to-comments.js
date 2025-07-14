'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('comments', 'is_anonymous', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否匿名评论'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('comments', 'is_anonymous');
  }
};
