/**
 * 快速导入推荐配置的脚本
 * 用法: node quick-import.js [模式名称]
 * 例如: node quick-import.js development
 */

const fs = require('fs');
const path = require('path');

// 配置映射
const configMap = {
  'development': 'development-mode.json',
  'dev': 'development-mode.json',
  'production': 'production-mode.json',
  'prod': 'production-mode.json',
  'high-quality': 'high-quality-mode.json',
  'quality': 'high-quality-mode.json',
  'active': 'active-mode.json',
  'current': 'recommendation-config-2025-08-28.json'
};

async function quickImport() {
  const mode = process.argv[2];
  
  if (!mode) {
    console.log('🚀 快速配置导入工具\n');
    console.log('用法: node quick-import.js [模式名称]\n');
    console.log('可用模式:');
    console.log('  development / dev     - 开发模式 (阈值: 5.0)');
    console.log('  production / prod     - 生产模式 (阈值: 12.0)');
    console.log('  high-quality / quality - 高质量模式 (阈值: 18.0)');
    console.log('  active                - 活跃模式 (阈值: 8.0)');
    console.log('  current               - 当前导出的配置 (阈值: 10.0)');
    console.log('\n示例:');
    console.log('  node quick-import.js development');
    console.log('  node quick-import.js prod');
    return;
  }
  
  const configFile = configMap[mode.toLowerCase()];
  
  if (!configFile) {
    console.log(`❌ 未知模式: ${mode}`);
    console.log('支持的模式: development, production, high-quality, active, current');
    return;
  }
  
  const configPath = path.join(__dirname, configFile);
  
  if (!fs.existsSync(configPath)) {
    console.log(`❌ 配置文件不存在: ${configFile}`);
    return;
  }
  
  try {
    // 读取配置
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log(`🚀 正在应用配置: ${config.name}`);
    console.log(`📝 描述: ${config.description}`);
    console.log(`🎯 推荐阈值: ${config.settings.scoreThreshold}`);
    console.log(`⏰ 更新间隔: ${config.settings.updateIntervalHours}小时`);
    console.log('');
    
    // 这里需要实际的导入逻辑
    // 由于需要数据库连接，这里只是显示配置信息
    console.log('📋 完整配置:');
    console.log(JSON.stringify(config.settings, null, 2));
    
    console.log('\n💡 下一步操作:');
    console.log('1. 在管理后台导入此配置文件');
    console.log('2. 或者将上述配置复制到管理界面');
    console.log('3. 点击"🔄 重新计算分数"应用更改');
    
  } catch (error) {
    console.log(`❌ 读取配置失败: ${error.message}`);
  }
}

quickImport();
