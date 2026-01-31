const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '操作管理员ID',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      target_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '目标类型: post, comment, user'
      },
      target_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '目标ID'
      },
      action: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '动作: approve, reject, ban, delete'
      },
      reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '操作原因'
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: '操作者IP'
      }
    },
    {
      tableName: 'audit_logs',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['admin_id']
        },
        {
          fields: ['target_id', 'target_type']
        },
        {
          fields: ['action']
        },
        {
          fields: ['created_at']
        }
      ]
    }
  );

  AuditLog.associate = models => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'admin_id',
      as: 'admin'
    });
  };

  return AuditLog;
};
