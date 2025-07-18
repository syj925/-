module.exports = (sequelize, DataTypes) => {
  const UserRejectionLog = sequelize.define(
    'UserRejectionLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '被拒绝的用户名'
      },
      nickname: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '用户昵称'
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '用户邮箱'
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '拒绝原因'
      },
      rejected_by: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '操作管理员ID',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '拒绝时间'
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP地址'
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '用户代理'
      }
    },
    {
      tableName: 'user_rejection_logs',
      timestamps: true,
      underscored: true,
      paranoid: false, // 禁用软删除，拒绝记录不需要删除
      indexes: [
        {
          fields: ['username']
        },
        {
          fields: ['rejected_by']
        },
        {
          fields: ['rejected_at']
        },
        {
          fields: ['created_at']
        }
      ],
      comment: '用户注册拒绝记录表'
    }
  );

  /**
   * 定义关联关系
   */
  UserRejectionLog.associate = function(models) {
    // 拒绝记录属于管理员用户
    UserRejectionLog.belongsTo(models.User, {
      foreignKey: 'rejected_by',
      as: 'admin'
    });
  };

  return UserRejectionLog;
};
