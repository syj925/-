const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const OperationLog = sequelize.define(
    'OperationLog',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '操作管理员ID'
      },
      admin_username: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '操作管理员用户名'
      },
      method: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: '请求方法'
      },
      path: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '请求路径'
      },
      ip: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP地址'
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '用户代理'
      },
      status_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '响应状态码'
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '耗时(ms)'
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '操作模块'
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '操作描述'
      },
      request_body: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '请求参数JSON'
      }
    },
    {
      tableName: 'operation_logs',
      timestamps: true,
      updatedAt: false, // 只记录创建时间
      underscored: true,
      indexes: [
        {
          fields: ['admin_id']
        },
        {
          fields: ['created_at']
        },
        {
          fields: ['type']
        }
      ]
    }
  );

  OperationLog.associate = models => {
    OperationLog.belongsTo(models.User, {
      foreignKey: 'admin_id',
      as: 'admin'
    });
  };

  return OperationLog;
};
