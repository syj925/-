/**
 * 配置对比工具 - 可视化展示各个模式的差异
 */

const fs = require('fs');
const path = require('path');

// 要对比的配置文件
const configFiles = [
  { key: 'current', file: 'recommendation-config-2025-08-28.json', name: '当前配置' },
  { key: 'dev', file: 'development-mode.json', name: '开发模式' },
  { key: 'prod', file: 'production-mode.json', name: '生产模式' },
  { key: 'quality', file: 'high-quality-mode.json', name: '高质量模式' },
  { key: 'active', file: 'active-mode.json', name: '活跃模式' }
];

// 关键参数配置
const keyParams = [
  { key: 'scoreThreshold', name: '推荐阈值', unit: '' },
  { key: 'likeWeight', name: '点赞权重', unit: '' },
  { key: 'commentWeight', name: '评论权重', unit: '' },
  { key: 'collectionWeight', name: '收藏权重', unit: '' },
  { key: 'viewWeight', name: '浏览权重', unit: '' },
  { key: 'newPostBonus', name: '新帖加分', unit: '' },
  { key: 'updateIntervalHours', name: '更新间隔', unit: '小时' },
  { key: 'maxAdminRecommended', name: '管理员推荐数', unit: '个' },
  { key: 'minInteractionScore', name: '最低互动分数', unit: '' },
  { key: 'maxSameAuthorRatio', name: '同作者占比', unit: '' },
  { key: 'timeDecayDays', name: '时间衰减天数', unit: '天' },
  { key: 'cacheExpireMinutes', name: '缓存时间', unit: '分钟' }
];

function loadConfigs() {
  const configs = {};
  
  for (const configInfo of configFiles) {
    const filePath = path.join(__dirname, configInfo.file);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const config = JSON.parse(content);
        configs[configInfo.key] = {
          ...configInfo,
          settings: config.settings,
          description: config.description
        };
      } catch (error) {
        console.log(`⚠️  无法读取 ${configInfo.file}: ${error.message}`);
      }
    }
  }
  
  return configs;
}

function formatValue(value, unit) {
  if (typeof value === 'number') {
    return value.toString() + (unit ? ` ${unit}` : '');
  }
  return value?.toString() || 'N/A';
}

function getValueColor(value, param, allValues) {
  if (typeof value !== 'number') return '';
  
  const values = allValues.filter(v => typeof v === 'number');
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (value === min) return '🟢'; // 最小值
  if (value === max) return '🔴'; // 最大值
  return '🟡'; // 中间值
}

function compareConfigs() {
  console.log('📊 推荐算法配置对比表\n');
  
  const configs = loadConfigs();
  const configKeys = Object.keys(configs);
  
  if (configKeys.length === 0) {
    console.log('❌ 没有找到有效的配置文件');
    return;
  }
  
  // 显示基本信息
  console.log('📋 配置概览:');
  configKeys.forEach(key => {
    const config = configs[key];
    console.log(`  ${config.name}: ${config.description}`);
  });
  console.log('');
  
  // 创建对比表格
  console.log('📈 详细参数对比:');
  console.log(''.padEnd(100, '='));
  
  // 表头
  const header = '参数'.padEnd(20) + configKeys.map(key => 
    configs[key].name.padEnd(16)
  ).join('');
  console.log(header);
  console.log(''.padEnd(100, '-'));
  
  // 各参数对比
  keyParams.forEach(param => {
    const values = configKeys.map(key => configs[key].settings[param.key]);
    
    let row = param.name.padEnd(20);
    
    configKeys.forEach((key, index) => {
      const value = configs[key].settings[param.key];
      const formattedValue = formatValue(value, param.unit);
      const color = getValueColor(value, param.key, values);
      
      row += `${color} ${formattedValue}`.padEnd(16);
    });
    
    console.log(row);
  });
  
  console.log(''.padEnd(100, '='));
  
  // 图例说明
  console.log('\n📊 图例说明:');
  console.log('  🟢 最小值  🟡 中间值  🔴 最大值\n');
  
  // 推荐使用场景
  console.log('💡 使用建议:');
  console.log('  开发模式: 测试环境，快速验证功能');
  console.log('  生产模式: 正式环境，平衡质量和数量');
  console.log('  高质量模式: 追求内容质量，严格筛选');
  console.log('  活跃模式: 提升活跃度，鼓励互动');
  console.log('');
  
  // 切换建议
  console.log('🔄 切换步骤:');
  console.log('  1. 选择适合的模式配置文件');
  console.log('  2. 在管理后台导入配置');
  console.log('  3. 点击"重新计算分数"');
  console.log('  4. 观察推荐效果并调整');
}

compareConfigs();
