const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const EventRegistration = sequelize.define(
    'EventRegistration',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false,
        comment: '报名记录ID'
      },
      event_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '活动ID',
        references: {
          model: 'events',
          key: 'id'
        }
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '用户ID',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      form_data: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '报名表单数据（JSON）',
        get() {
          const rawValue = this.getDataValue('form_data');
          return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
          this.setDataValue('form_data', value ? JSON.stringify(value) : null);
        }
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '报名状态：1-已报名，2-已参加，0-已取消'
      },
      registered_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '报名时间'
      },
      canceled_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '取消报名时间'
      },
      cancel_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '取消报名原因'
      },
      check_in_time: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '签到时间'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '备注信息'
      }
    },
    {
      tableName: 'event_registrations',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['event_id', 'user_id'],
          name: 'uk_event_user'
        },
        {
          fields: ['event_id']
        },
        {
          fields: ['user_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['registered_at']
        }
      ]
    }
  );

  // 定义关联关系
  EventRegistration.associate = (models) => {
    // 活动关联
    EventRegistration.belongsTo(models.Event, {
      foreignKey: 'event_id',
      as: 'event'
    });

    // 用户关联
    EventRegistration.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return EventRegistration;
};
