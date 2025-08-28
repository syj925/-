#!/usr/bin/env node

/**
 * 推荐分数定时更新任务 v2.0
 * 
 * 用途：
 * - 定期计算和更新帖子推荐分数
 * - 设置auto_recommended字段
 * - 替代实时计算，提升API性能
 * 
 * 使用方法：
 * - 手动执行：node scripts/update-recommendation-scores.js
 * - 定时任务：0 * * * * node scripts/update-recommendation-scores.js (每小时)
 * - 强制更新：node scripts/update-recommendation-scores.js --force
 */

const path = require('path');

// 设置项目根目录路径
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// 引入必要模块
const scoreCalculator = require('../src/services/recommendation-score-calculator');
const logger = require('../config/logger');

/**
 * 主执行函数
 */
async function main() {
  const startTime = Date.now();
  logger.info('🚀 推荐分数更新任务开始执行');

  try {
    // 解析命令行参数
    const args = process.argv.slice(2);
    const forceUpdate = args.includes('--force') || args.includes('-f');
    const maxAgeDays = getArgValue(args, '--max-age') || null;

    logger.info('📋 任务参数', { forceUpdate, maxAgeDays });

    // 执行计算和更新
    const result = await scoreCalculator.calculateAndUpdateScores({
      forceUpdate,
      maxAgeDays: maxAgeDays ? parseInt(maxAgeDays) : null
    });

    // 获取更新后的统计信息
    const stats = await scoreCalculator.getCalculationStats();

    const duration = Date.now() - startTime;
    logger.info('✅ 推荐分数更新任务完成', {
      duration: `${duration}ms`,
      result,
      stats
    });

    // 输出任务报告
    printTaskReport(result, stats, duration);

    process.exit(0);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ 推荐分数更新任务失败', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });

    console.error('任务执行失败:', error.message);
    process.exit(1);
  }
}

/**
 * 获取命令行参数值
 * @param {Array} args 参数数组
 * @param {String} flag 参数标志
 * @returns {String|null} 参数值
 */
function getArgValue(args, flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}

/**
 * 打印任务报告
 * @param {Object} result 执行结果
 * @param {Object} stats 统计信息
 * @param {Number} duration 执行时间
 */
function printTaskReport(result, stats, duration) {
  console.log('\n📊 推荐分数更新报告');
  console.log('=' .repeat(50));
  console.log(`执行时间: ${duration}ms`);
  console.log(`处理帖子: ${result.processed} 个`);
  console.log(`新增推荐: ${result.recommended} 个`);
  console.log(`取消推荐: ${result.unrecommended} 个`);
  
  if (stats) {
    console.log('\n📈 系统统计:');
    console.log(`总帖子数: ${stats.totalPosts}`);
    console.log(`推荐帖子: ${stats.totalRecommended}`);
    console.log(`推荐率: ${stats.recommendationRate}%`);
    console.log(`平均分数: ${stats.avgScore}`);
    console.log(`最后更新: ${stats.lastUpdateTime || '未知'}`);
  }
  
  console.log('=' .repeat(50));
}

/**
 * 优雅退出处理
 */
process.on('SIGINT', () => {
  logger.info('🛑 接收到退出信号，正在清理...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 接收到终止信号，正在清理...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', { reason, promise });
  process.exit(1);
});

// 如果是直接执行该脚本，则运行主函数
if (require.main === module) {
  main().catch(error => {
    logger.error('主函数执行失败:', error);
    process.exit(1);
  });
}

module.exports = { main };
