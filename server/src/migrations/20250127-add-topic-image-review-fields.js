'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 添加待审核图片字段
    await queryInterface.addColumn('topics', 'pending_image', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: '待审核的封面图片'
    });

    // 添加图片状态字段
    await queryInterface.addColumn('topics', 'image_status', {
      type: Sequelize.ENUM('default', 'pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'default',
      comment: '图片状态：default(默认), pending(待审核), approved(已通过), rejected(已拒绝)'
    });

    // 为现有数据设置默认状态
    await queryInterface.sequelize.query(`
      UPDATE topics 
      SET image_status = CASE 
        WHEN cover_image IS NOT NULL AND cover_image != '' THEN 'approved'
        ELSE 'default'
      END
    `);
  },

  async down(queryInterface, Sequelize) {
    // 删除图片状态字段
    await queryInterface.removeColumn('topics', 'image_status');
    
    // 删除待审核图片字段
    await queryInterface.removeColumn('topics', 'pending_image');
  }
};
