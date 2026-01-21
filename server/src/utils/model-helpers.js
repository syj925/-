/**
 * 模型辅助工具
 * 统一管理所有模型的公共字段，确保数据结构一致性
 */
const { v4: uuidv4 } = require('uuid');

/**
 * 基础UUID主键字段
 * @param {Object} DataTypes Sequelize DataTypes
 * @returns {Object} 主键字段定义
 */
const getBaseIdField = (DataTypes) => ({
  type: DataTypes.UUID,
  primaryKey: true,
  defaultValue: () => uuidv4(),
  allowNull: false
});

/**
 * 基础时间戳字段
 * @param {Object} DataTypes Sequelize DataTypes
 * @returns {Object} 时间戳字段定义
 */
const getBaseTimestamps = (DataTypes) => ({
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

/**
 * 创建包含基础字段的模型字段定义
 * @param {Object} DataTypes Sequelize DataTypes
 * @param {Object} customFields 自定义业务字段
 * @param {Object} options 选项
 * @param {boolean} options.includeTimestamps 是否包含时间戳字段，默认true
 * @returns {Object} 完整的字段定义对象
 */
const createModelFields = (DataTypes, customFields, options = {}) => {
  const { includeTimestamps = true } = options;
  
  const fields = {
    id: getBaseIdField(DataTypes),
    ...customFields
  };
  
  if (includeTimestamps) {
    Object.assign(fields, getBaseTimestamps(DataTypes));
  }
  
  return fields;
};

/**
 * 获取标准的模型选项配置
 * @param {Object} customOptions 自定义选项
 * @returns {Object} 模型选项
 */
const getBaseModelOptions = (customOptions = {}) => ({
  timestamps: true,
  underscored: true,
  paranoid: false, // 可以根据需要启用软删除
  ...customOptions
});

module.exports = {
  getBaseIdField,
  getBaseTimestamps,
  createModelFields,
  getBaseModelOptions
};
