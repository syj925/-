const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    target: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    oldData: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    newData: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'logs',
    timestamps: true,
    updatedAt: false
  });

  // 定义关联关系
  Log.associate = (models) => {
    Log.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return Log;
}; 