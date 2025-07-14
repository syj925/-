const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'string' // string, number, boolean, json
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    paranoid: false // 明确禁用paranoid模式，因为该表没有deleted_at字段
  });

  return Setting;
}; 