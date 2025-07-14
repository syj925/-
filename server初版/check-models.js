/**
 * 检查模型文件是否正确导出函数
 */
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

// 获取所有模型文件
const modelFiles = fs.readdirSync(modelsDir).filter(file => {
  return file.indexOf('.') !== 0 && 
         file !== 'index.js' && 
         file !== 'init.js' && 
         file !== 'associations.js' && 
         file.slice(-3) === '.js';
});

// 检查每个模型文件
modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否导入了DataTypes
  const importDataTypes = content.includes('const { DataTypes } = require(\'sequelize\')');
  
  // 检查模块导出格式
  const exportWithDataTypes = content.includes('module.exports = (sequelize, DataTypes)');
  const exportWithoutDataTypes = content.includes('module.exports = (sequelize)');
  
  // 输出检查结果
  console.log(`检查文件: ${file}`);
  console.log(`  导入DataTypes: ${importDataTypes ? '是' : '否'}`);
  console.log(`  导出函数接收DataTypes参数: ${exportWithDataTypes ? '是' : '否'}`);
  console.log(`  导出函数不接收DataTypes参数: ${exportWithoutDataTypes ? '是' : '否'}`);
  
  // 标记问题文件
  if (importDataTypes && !exportWithDataTypes) {
    console.log(`  [问题] ${file} 导入了DataTypes但导出函数不接收DataTypes参数`);
  }
  
  console.log('---');
}); 