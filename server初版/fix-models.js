/**
 * 修复模型文件的导出函数
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

// 修复每个模型文件
let fixedCount = 0;
modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否导入了DataTypes
  const importDataTypes = content.includes('const { DataTypes } = require(\'sequelize\')');
  
  // 检查模块导出格式
  const exportWithDataTypes = content.includes('module.exports = (sequelize, DataTypes)');
  const exportWithoutDataTypes = content.includes('module.exports = (sequelize)');
  
  // 需要修复的情况：导入了DataTypes但导出函数不接收DataTypes参数
  if (importDataTypes && !exportWithDataTypes && exportWithoutDataTypes) {
    console.log(`修复文件: ${file}`);
    
    // 替换导出函数定义
    content = content.replace(
      'module.exports = (sequelize)',
      'module.exports = (sequelize, DataTypes)'
    );
    
    // 写回文件
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
  }
  
  // 特殊情况：没有导入DataTypes但导出函数也不接收DataTypes参数
  if (!importDataTypes && !exportWithDataTypes && exportWithoutDataTypes) {
    console.log(`特殊情况文件: ${file} - 需要手动检查`);
  }
});

console.log(`\n修复完成，共修复了 ${fixedCount} 个文件`); 