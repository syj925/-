const { DataTypes } = require('sequelize');

/**
 * EventRegistration模型定义 - 活动注册记录
 * @param {import('sequelize').Sequelize} sequelize - Sequelize实例
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize数据类型
 * @returns {import('sequelize').Model} - EventRegistration模型
 */
module.exports = (sequelize, DataTypes) => {
  const EventRegistration = sequelize.define('EventRegistration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID',
      field: 'user_id'
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '活动ID',
      field: 'event_id'
    },
    status: {
      type: DataTypes.ENUM('registered', 'pending', 'confirmed', 'rejected', 'cancelled', 'attended'),
      defaultValue: 'registered',
      comment: '状态: registered-已报名, pending-待审核, confirmed-已确认, rejected-已拒绝, cancelled-已取消, attended-已参加'
    },
    registrationInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '基本注册信息，如姓名、电话等',
      field: 'registration_info'
    },
    formData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户填写的自定义表单数据',
      field: 'form_data',
      get() {
        const rawValue = this.getDataValue('formData');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('formData', value ? JSON.stringify(value) : null);
      }
    },
    checkinTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '签到时间',
      field: 'checkin_time'
    },
    cancelTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '取消时间',
      field: 'cancel_time'
    },
    cancelReason: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '取消原因',
      field: 'cancel_reason'
    }
  }, {
    tableName: 'event_registrations',
    paranoid: true, // 软删除
    underscored: true, // 将驼峰命名转换为下划线
    timestamps: true, // 添加 createdAt 和 updatedAt
    indexes: [
      {
        name: 'idx_event_registration_user_event',
        fields: ['user_id', 'event_id'],
        unique: true
      },
      {
        name: 'idx_event_registration_event_id',
        fields: ['event_id']
      },
      {
        name: 'idx_event_registration_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_event_registration_status',
        fields: ['status']
      }
    ]
  });

  /**
   * 模型关联关系
   * @param {Object} models - 所有模型
   */
  EventRegistration.associate = function(models) {
    // 活动注册与用户的关系
    EventRegistration.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 活动注册与活动的关系
    EventRegistration.belongsTo(models.Event, {
      foreignKey: 'event_id',
      as: 'event'
    });
  };

  return EventRegistration;
}; 