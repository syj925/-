'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/sequelize.js')[env];
const db = {};

// 导入统一Sequelize实例和Sequelize构造函数
const { sequelize } = require('../config/sequelizeInstance');
const Sequelize = require('sequelize');

// 记录初始化
console.log(`初始化Sequelize实例，环境: ${env}`);

// 加载所有模型
console.log('开始加载模型文件...');
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js') && (file !== 'associations.js') && (file !== 'init.js');
  });

console.log(`找到 ${modelFiles.length} 个模型文件`);

// 加载每个模型
modelFiles.forEach(file => {
  try {
    const modelPath = path.join(__dirname, file);
    const modelExport = require(modelPath);
    
    if (typeof modelExport !== 'function') {
      console.error(`警告: ${file} 导出的不是函数，跳过加载`);
      return;
    }
    
    try {
      const model = modelExport(sequelize, Sequelize.DataTypes);
      if (model && model.name) {
        db[model.name] = model;
        console.log(`已加载模型: ${model.name}`);
      } else {
        console.error(`警告: ${file} 没有返回有效模型，跳过加载`);
      }
    } catch (modelError) {
      console.error(`初始化模型 ${file} 失败: ${modelError.message}`);
    }
  } catch (error) {
    console.error(`加载模型文件 ${file} 失败: ${error.message}`);
  }
});

// 标记模型已加载完成（这很重要）
db.modelsLoaded = true;

// 设置重要的属性
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 导出对象
module.exports = db; 