'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 创建系统通知表
    await queryInterface.createTable('system_notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      target_group: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'all'
      },
      scheduled_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      read_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 创建通知-接收者关系表
    await queryInterface.createTable('notification_recipients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      notification_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'system_notifications',
          key: 'id'
        }
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 添加索引
    await queryInterface.addIndex('notification_recipients', ['notification_id']);
    await queryInterface.addIndex('notification_recipients', ['recipient_id']);
    await queryInterface.addIndex('notification_recipients', ['is_read']);
    await queryInterface.addIndex('system_notifications', ['type']);
    await queryInterface.addIndex('system_notifications', ['target_group']);
    await queryInterface.addIndex('system_notifications', ['sender_id']);
  },

  async down(queryInterface, Sequelize) {
    // 删除索引由dropTable自动处理
    await queryInterface.dropTable('notification_recipients');
    await queryInterface.dropTable('system_notifications');
  }
}; 