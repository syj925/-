/**
 * 测试模型导出
 */
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// 配置数据库连接
const env = process.env.NODE_ENV || 'development';
const config = require('./config/sequelize')[env];
const sequelize = new Sequelize(
  config.database, 
  config.username, 
  config.password, 
  config
);

// 获取所有模型文件
const modelsDir = path.join(__dirname, 'models');
const modelFiles = fs.readdirSync(modelsDir).filter(file => {
  return file.indexOf('.') !== 0 && 
         file !== 'index.js' && 
         file !== 'init.js' && 
         file !== 'associations.js' && 
         file.slice(-3) === '.js';
});

console.log(`找到 ${modelFiles.length} 个模型文件: ${modelFiles.join(', ')}`);

// 测试每个模型文件
console.log('\n测试模型导出...');
modelFiles.forEach(file => {
  try {
    console.log(`\n检查文件: ${file}`);
    const modelPath = path.join(modelsDir, file);
    
    // 读取文件前几行，检查文件编码
    const content = fs.readFileSync(modelPath, 'utf8').slice(0, 200);
    console.log(`文件内容预览: \n${content.slice(0, 100)}...\n`);
    
    const modelExport = require(modelPath);
    console.log(`导出类型: ${typeof modelExport}`);
    
    if (typeof modelExport !== 'function') {
      console.error(`错误: ${file} 导出的不是函数`);
    } else {
      try {
        const model = modelExport(sequelize, Sequelize.DataTypes);
        if (model && model.name) {
          console.log(`成功: ${file} 导出正确，模型名称: ${model.name}`);
        } else {
          console.error(`错误: ${file} 导出的函数没有返回有效模型`);
        }
      } catch (initError) {
        console.error(`错误: ${file} 初始化模型失败: ${initError.message}`);
        console.error(initError.stack);
      }
    }
  } catch (error) {
    console.error(`错误加载 ${file}: ${error.message}`);
    console.error(error.stack);
  }
}); 