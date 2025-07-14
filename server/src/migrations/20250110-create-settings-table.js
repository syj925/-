'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '设置ID'
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '设置键名'
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '设置值'
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '设置描述'
      },
      type: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'json'),
        defaultValue: 'string',
        comment: '设置类型'
      },
      isSystem: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_system',
        comment: '是否为系统设置'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at',
        comment: '创建时间'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at',
        comment: '更新时间'
      }
    }, {
      comment: '系统设置表'
    });

    // 添加索引
    await queryInterface.addIndex('settings', ['key'], {
      unique: true,
      name: 'settings_key_unique'
    });

    await queryInterface.addIndex('settings', ['is_system'], {
      name: 'settings_is_system_index'
    });

    await queryInterface.addIndex('settings', ['type'], {
      name: 'settings_type_index'
    });

    // 插入默认系统设置
    await queryInterface.bulkInsert('settings', [
      // 基础设置
      {
        key: 'systemName',
        value: '校园墙管理系统',
        description: '系统名称',
        type: 'string',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'logoUrl',
        value: 'https://img01.yzcdn.cn/vant/cat.jpeg',
        description: '系统LOGO',
        type: 'string',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'footerText',
        value: '© 2023 校园墙管理系统',
        description: '页脚文本',
        type: 'string',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'icp',
        value: '京ICP备12345678号',
        description: '备案号',
        type: 'string',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // 内容设置
      {
        key: 'enableAudit',
        value: 'true',
        description: '是否开启内容审核',
        type: 'boolean',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'allowAnonymous',
        value: 'false',
        description: '是否允许匿名发帖',
        type: 'boolean',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'dailyPostLimit',
        value: '10',
        description: '每日发帖限制',
        type: 'number',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'enableSensitiveFilter',
        value: 'true',
        description: '内容敏感词过滤',
        type: 'boolean',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'sensitiveWords',
        value: '赌博,色情,政治,暴力,诈骗',
        description: '敏感词列表',
        type: 'string',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // 用户设置
      {
        key: 'enableRegister',
        value: 'true',
        description: '是否开启用户注册',
        type: 'boolean',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'requireUserAudit',
        value: 'true',
        description: '新用户是否需要审核',
        type: 'boolean',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'defaultRole',
        value: 'user',
        description: '默认用户角色',
        type: 'string',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        key: 'avatarSizeLimit',
        value: '2',
        description: '用户头像上传大小限制(MB)',
        type: 'number',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      // 消息设置
      {
        key: 'readDelaySeconds',
        value: '5',
        description: '消息已读延迟秒数',
        type: 'number',
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('settings');
  }
};
