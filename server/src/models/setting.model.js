const { DataTypes } = require('sequelize');

/**
 * 系统设置模型
 * @param {Object} sequelize Sequelize实例
 * @param {Object} DataTypes 数据类型
 * @returns {Object} Setting模型
 */
module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '设置ID'
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '设置键名'
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '设置值'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '设置描述'
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string',
      comment: '设置类型'
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为系统设置'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    paranoid: false,
    comment: '系统设置表',
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['isSystem']
      },
      {
        fields: ['type']
      }
    ]
  });

  return Setting;
};
