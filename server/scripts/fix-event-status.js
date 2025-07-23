/**
 * 修复活动状态数据脚本
 * 将状态 0（已取消）更新为状态 4（已取消）
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库配置
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log,
    timezone: '+08:00'
  }
);

async function fixEventStatus() {
  try {
    console.log('开始修复活动状态...');
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 查询当前状态为 0 的活动
    const [results] = await sequelize.query(
      'SELECT id, title, status FROM events WHERE status = 0 AND deleted_at IS NULL'
    );
    
    console.log(`找到 ${results.length} 个状态为 0 的活动`);
    
    if (results.length > 0) {
      console.log('需要更新的活动:');
      results.forEach(event => {
        console.log(`- ${event.title} (ID: ${event.id})`);
      });
      
      // 更新状态 0 -> 4
      const [affectedRows] = await sequelize.query(
        'UPDATE events SET status = 4 WHERE status = 0 AND deleted_at IS NULL'
      );
      
      console.log(`成功更新 ${affectedRows.affectedRows || results.length} 个活动的状态`);
    } else {
      console.log('没有需要更新的活动');
    }
    
    // 显示当前所有活动状态统计
    const [statusStats] = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count,
        CASE 
          WHEN status = 1 THEN '未开始'
          WHEN status = 2 THEN '进行中'
          WHEN status = 3 THEN '已结束'
          WHEN status = 4 THEN '已取消'
          ELSE '未知状态'
        END as status_name
      FROM events 
      WHERE deleted_at IS NULL 
      GROUP BY status 
      ORDER BY status
    `);
    
    console.log('\n当前活动状态统计:');
    statusStats.forEach(stat => {
      console.log(`状态 ${stat.status} (${stat.status_name}): ${stat.count} 个活动`);
    });
    
    console.log('\n活动状态修复完成！');
    
  } catch (error) {
    console.error('修复活动状态失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 执行修复
fixEventStatus();
