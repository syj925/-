const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    'Event',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false,
        comment: '活动ID'
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '活动标题',
        validate: {
          len: [1, 100],
          notEmpty: true
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '活动描述'
      },
      cover_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '活动封面图片'
      },
      detail_images: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '活动详情图片（JSON数组）',
        get() {
          const rawValue = this.getDataValue('detail_images');
          if (!rawValue) return [];
          
          try {
            // 如果已经是数组，直接返回
            if (Array.isArray(rawValue)) return rawValue;
            // 尝试解析JSON
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            console.error('解析detail_images JSON失败:', error, '原始值:', rawValue);
            // 如果解析失败，尝试按逗号分割字符串
            if (typeof rawValue === 'string') {
              return rawValue.split(',').map(item => item.trim()).filter(item => item);
            }
            return [];
          }
        },
        set(value) {
          this.setDataValue('detail_images', value ? JSON.stringify(value) : null);
        }
      },
      organizer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '组织者ID'
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '活动开始时间'
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '活动结束时间'
      },
      location: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '活动地点'
      },
      max_participants: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '最大参与人数，null表示无限制'
      },
      current_participants: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '当前参与人数'
      },
      registration_deadline: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '报名截止时间'
      },
      form_config: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '报名表单配置（JSON）',
        get() {
          const rawValue = this.getDataValue('form_config');
          if (!rawValue) return [];
          
          try {
            // 如果已经是数组或对象，直接返回
            if (Array.isArray(rawValue) || typeof rawValue === 'object') return rawValue;
            // 尝试解析JSON
            return JSON.parse(rawValue);
          } catch (error) {
            console.error('解析form_config JSON失败:', error, '原始值:', rawValue);
            return [];
          }
        },
        set(value) {
          this.setDataValue('form_config', value ? JSON.stringify(value) : null);
        }
      },
      notices: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '活动须知（JSON数组）',
        get() {
          const rawValue = this.getDataValue('notices');
          if (!rawValue) return [];
          
          try {
            // 如果已经是数组，直接返回
            if (Array.isArray(rawValue)) return rawValue;
            // 尝试解析JSON
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            console.error('解析notices JSON失败:', error, '原始值:', rawValue);
            // 如果解析失败，尝试按逗号分割字符串
            if (typeof rawValue === 'string') {
              return rawValue.split(',').map(item => item.trim()).filter(item => item);
            }
            return [];
          }
        },
        set(value) {
          this.setDataValue('notices', value ? JSON.stringify(value) : null);
        }
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '活动状态：1-未开始，2-进行中，3-已结束，4-已取消'
      },
      is_recommended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否推荐活动'
      },
      allow_cancel_registration: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否允许取消报名'
      },
      view_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '浏览次数'
      }
    },
    {
      tableName: 'events',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organizer_id']
        },
        {
          fields: ['status']
        },
        {
          fields: ['start_time']
        },
        {
          fields: ['is_recommended']
        },
        {
          fields: ['status', 'start_time']
        }
      ]
    }
  );

  // 定义关联关系
  Event.associate = (models) => {
    // 组织者关联
    Event.belongsTo(models.User, {
      foreignKey: 'organizer_id',
      as: 'organizer'
    });

    // 报名记录关联
    Event.hasMany(models.EventRegistration, {
      foreignKey: 'event_id',
      as: 'registrations'
    });
  };

  return Event;
};
