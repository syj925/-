const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    detailImages: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('detailImages');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('detailImages', value ? JSON.stringify(value) : null);
      }
    },
    notices: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('notices');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('notices', value ? JSON.stringify(value) : null);
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'ongoing', 'past', 'canceled'),
      defaultValue: 'upcoming'
    },
    isRecommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否推荐活动',
      field: 'is_recommended'
    },
    // 新增字段 - 报名表单配置
    registrationFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '报名需填写的字段配置',
      get() {
        const rawValue = this.getDataValue('registrationFields');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('registrationFields', value ? JSON.stringify(value) : null);
      }
    },
    // 新增字段 - 是否允许取消报名
    allowCancelRegistration: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否允许取消报名'
    },
    // 新增字段 - 报名截止时间
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '报名截止日期'
    }
  }, {
    tableName: 'events',
    timestamps: true,
    paranoid: true // 软删除
  });

  // 定义关联关系
  Event.associate = (models) => {
    // 创建者关联
    Event.belongsTo(models.User, {
      foreignKey: 'creatorId',
      as: 'creator'
    });

    // 参与者关联（多对多）
    Event.belongsToMany(models.User, {
      through: 'EventParticipants',
      foreignKey: 'eventId',
      as: 'participants'
    });
    
    // 报名记录关联
    Event.hasMany(models.EventRegistration, {
      foreignKey: 'eventId',
      as: 'registrations'
    });
  };

  return Event;
}; 