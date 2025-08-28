/**
 * 验证推荐配置文件的完整性和格式
 */

const fs = require('fs');
const path = require('path');

// 需要验证的配置文件
const configFiles = [
  'recommendation-config-2025-08-28.json',
  'development-mode.json',
  'production-mode.json',
  'high-quality-mode.json',
  'active-mode.json'
];

// 必需的配置字段
const requiredFields = [
  'likeWeight', 'commentWeight', 'collectionWeight', 'viewWeight',
  'timeDecayDays', 'maxAgeDays', 'scoreThreshold', 'maxAdminRecommended',
  'enableScoreSort', 'updateIntervalHours', 'newPostBonus', 'imageBonus',
  'contentBonus', 'topicBonus', 'engagementFactor', 'minInteractionScore',
  'strategy', 'enableCache', 'cacheExpireMinutes', 'maxSameAuthorRatio',
  'diversityPeriodHours', 'searchPageRecommendCount', 'enableSearchPageRecommend',
  'searchRecommendTypes'
];

async function validateConfigs() {
  console.log('🔍 验证推荐配置文件...\n');
  
  const results = [];
  
  for (const fileName of configFiles) {
    const filePath = path.join(__dirname, fileName);
    
    console.log(`📋 检查文件: ${fileName}`);
    
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.log(`  ❌ 文件不存在`);
        results.push({ file: fileName, status: 'missing' });
        continue;
      }
      
      // 读取并解析JSON
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      
      // 检查基本结构
      if (!config.settings) {
        console.log(`  ❌ 缺少settings字段`);
        results.push({ file: fileName, status: 'invalid_structure' });
        continue;
      }
      
      // 检查必需字段
      const missingFields = requiredFields.filter(field => 
        config.settings[field] === undefined
      );
      
      if (missingFields.length > 0) {
        console.log(`  ❌ 缺少字段: ${missingFields.join(', ')}`);
        results.push({ file: fileName, status: 'missing_fields', missing: missingFields });
        continue;
      }
      
      // 检查数值类型
      const numericFields = [
        'likeWeight', 'commentWeight', 'collectionWeight', 'viewWeight',
        'timeDecayDays', 'maxAgeDays', 'scoreThreshold', 'maxAdminRecommended',
        'updateIntervalHours', 'newPostBonus', 'imageBonus', 'contentBonus',
        'topicBonus', 'engagementFactor', 'minInteractionScore', 'cacheExpireMinutes',
        'maxSameAuthorRatio', 'diversityPeriodHours', 'searchPageRecommendCount'
      ];
      
      const invalidTypes = numericFields.filter(field => 
        typeof config.settings[field] !== 'number'
      );
      
      if (invalidTypes.length > 0) {
        console.log(`  ⚠️  类型错误: ${invalidTypes.join(', ')}`);
      }
      
      // 显示配置摘要
      console.log(`  ✅ 配置有效`);
      console.log(`     - 模式: ${config.name}`);
      console.log(`     - 推荐阈值: ${config.settings.scoreThreshold}`);
      console.log(`     - 更新间隔: ${config.settings.updateIntervalHours}小时`);
      
      results.push({ file: fileName, status: 'valid', config });
      
    } catch (error) {
      console.log(`  ❌ 解析错误: ${error.message}`);
      results.push({ file: fileName, status: 'parse_error', error: error.message });
    }
    
    console.log('');
  }
  
  // 显示汇总
  console.log('📊 验证汇总:');
  const validCount = results.filter(r => r.status === 'valid').length;
  const totalCount = results.length;
  
  console.log(`  ✅ 有效配置: ${validCount}/${totalCount}`);
  
  if (validCount === totalCount) {
    console.log('🎉 所有配置文件都有效！');
    
    // 显示推荐阈值对比
    console.log('\n📈 推荐阈值对比:');
    results
      .filter(r => r.status === 'valid')
      .sort((a, b) => a.config.settings.scoreThreshold - b.config.settings.scoreThreshold)
      .forEach(r => {
        console.log(`  ${r.config.name}: ${r.config.settings.scoreThreshold}`);
      });
  } else {
    console.log('❌ 存在无效配置，请检查上述错误');
  }
}

// 运行验证
validateConfigs().catch(console.error);
