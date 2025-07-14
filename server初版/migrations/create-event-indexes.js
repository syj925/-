'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 简化迁移，只添加topic相关字段
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // 什么也不做
    return Promise.resolve();
  }
}; 