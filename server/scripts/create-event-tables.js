const { sequelize } = require('../src/models');
const logger = require('../config/logger');

/**
 * 创建活动相关数据表
 */
async function createEventTables() {
  try {
    logger.info('开始创建活动相关数据表...');

    // 创建活动表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`events\` (
        \`id\` char(36) NOT NULL,
        \`title\` varchar(100) NOT NULL COMMENT '活动标题',
        \`description\` text COMMENT '活动描述',
        \`cover_image\` varchar(255) DEFAULT NULL COMMENT '活动封面图片',
        \`detail_images\` text COMMENT '活动详情图片（JSON数组）',
        \`organizer_id\` char(36) NOT NULL COMMENT '组织者ID',
        \`start_time\` datetime NOT NULL COMMENT '活动开始时间',
        \`end_time\` datetime NOT NULL COMMENT '活动结束时间',
        \`location\` varchar(200) DEFAULT NULL COMMENT '活动地点',
        \`max_participants\` int DEFAULT NULL COMMENT '最大参与人数，null表示无限制',
        \`current_participants\` int NOT NULL DEFAULT '0' COMMENT '当前参与人数',
        \`registration_deadline\` datetime DEFAULT NULL COMMENT '报名截止时间',
        \`form_config\` text COMMENT '报名表单配置（JSON）',
        \`notices\` text COMMENT '活动须知（JSON数组）',
        \`status\` tinyint NOT NULL DEFAULT '1' COMMENT '活动状态：1-报名中，2-进行中，3-已结束，0-已取消',
        \`is_recommended\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否推荐活动',
        \`allow_cancel_registration\` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否允许取消报名',
        \`view_count\` int NOT NULL DEFAULT '0' COMMENT '浏览次数',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_organizer_id\` (\`organizer_id\`),
        KEY \`idx_status\` (\`status\`),
        KEY \`idx_start_time\` (\`start_time\`),
        KEY \`idx_is_recommended\` (\`is_recommended\`),
        KEY \`idx_status_start_time\` (\`status\`,\`start_time\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';
    `);

    logger.info('活动表创建成功');

    // 创建活动报名表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`event_registrations\` (
        \`id\` char(36) NOT NULL,
        \`event_id\` char(36) NOT NULL COMMENT '活动ID',
        \`user_id\` char(36) NOT NULL COMMENT '用户ID',
        \`form_data\` text COMMENT '报名表单数据（JSON）',
        \`status\` tinyint NOT NULL DEFAULT '1' COMMENT '报名状态：1-已报名，2-已参加，0-已取消',
        \`registered_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
        \`canceled_at\` datetime DEFAULT NULL COMMENT '取消报名时间',
        \`cancel_reason\` varchar(255) DEFAULT NULL COMMENT '取消报名原因',
        \`check_in_time\` datetime DEFAULT NULL COMMENT '签到时间',
        \`notes\` text COMMENT '备注信息',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_event_user\` (\`event_id\`,\`user_id\`),
        KEY \`idx_event_id\` (\`event_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_status\` (\`status\`),
        KEY \`idx_registered_at\` (\`registered_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动报名表';
    `);

    logger.info('活动报名表创建成功');

    logger.info('活动相关数据表创建完成！');

    // 验证表是否创建成功
    const [eventsResult] = await sequelize.query("SHOW TABLES LIKE 'events'");
    const [registrationsResult] = await sequelize.query("SHOW TABLES LIKE 'event_registrations'");

    if (eventsResult.length > 0 && registrationsResult.length > 0) {
      logger.info('✅ 所有活动相关表创建成功并验证通过');
      
      // 显示表结构
      logger.info('活动表结构:');
      const [eventsStructure] = await sequelize.query("DESCRIBE events");
      console.table(eventsStructure);

      logger.info('活动报名表结构:');
      const [registrationsStructure] = await sequelize.query("DESCRIBE event_registrations");
      console.table(registrationsStructure);

    } else {
      logger.error('❌ 表创建验证失败');
    }

  } catch (error) {
    logger.error('创建活动相关数据表失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createEventTables()
    .then(() => {
      logger.info('脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = createEventTables;
