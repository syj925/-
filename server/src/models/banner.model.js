const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Banner = sequelize.define(
    'Banner',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [1, 100],
          notEmpty: true
        }
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      linkType: {
        type: DataTypes.ENUM('url', 'post', 'topic', 'event', 'page'),
        defaultValue: 'url',
        field: 'link_type'
      },
      linkValue: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'link_value'
      },
      targetId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'target_id'
      },
      scene: {
        type: DataTypes.ENUM('home', 'discover', 'search-main', 'search-topic'),
        defaultValue: 'home',
        validate: {
          isIn: [['home', 'discover', 'search-main', 'search-topic']]
        }
      },
      platform: {
        type: DataTypes.ENUM('app', 'web', 'admin', 'all'),
        defaultValue: 'all',
        validate: {
          isIn: [['app', 'web', 'admin', 'all']]
        }
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sort_order',
        validate: {
          min: 0
        }
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        validate: {
          isIn: [['active', 'inactive']]
        }
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'start_time'
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'end_time',
        validate: {
          isAfterStartTime(value) {
            if (value && this.startTime && value <= this.startTime) {
              throw new Error('结束时间必须晚于开始时间');
            }
          }
        }
      },
      clickCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'click_count',
        validate: {
          min: 0
        }
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'view_count',
        validate: {
          min: 0
        }
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidTags(value) {
            if (value && !Array.isArray(value)) {
              throw new Error('标签必须是数组格式');
            }
          }
        }
      }
    },
    {
      tableName: 'banners',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['scene', 'platform', 'status']
        },
        {
          fields: ['sort_order', 'priority']
        },
        {
          fields: ['start_time', 'end_time']
        },
        {
          fields: ['status']
        },
        {
          fields: ['scene']
        }
      ]
    }
  );

  // 定义关联关系
  Banner.associate = (models) => {
    // 如果需要关联到其他模型，可以在这里定义
    // 例如：关联到创建者用户
    // Banner.belongsTo(models.User, {
    //   foreignKey: 'created_by',
    //   as: 'creator'
    // });
  };

  // 实例方法
  Banner.prototype.isActive = function() {
    if (this.status !== 'active') return false;
    
    const now = new Date();
    if (this.startTime && now < this.startTime) return false;
    if (this.endTime && now > this.endTime) return false;
    
    return true;
  };

  Banner.prototype.incrementClick = async function() {
    return await this.increment('clickCount');
  };

  Banner.prototype.incrementView = async function() {
    return await this.increment('viewCount');
  };

  // 类方法
  Banner.getActiveByScene = async function(scene, platform = 'all', limit = 5) {
    const whereConditions = {
      scene,
      status: 'active'
    };

    if (platform !== 'all') {
      whereConditions.platform = [platform, 'all'];
    }

    const now = new Date();
    whereConditions.startTime = {
      [sequelize.Sequelize.Op.or]: [
        { [sequelize.Sequelize.Op.lte]: now },
        { [sequelize.Sequelize.Op.is]: null }
      ]
    };
    whereConditions.endTime = {
      [sequelize.Sequelize.Op.or]: [
        { [sequelize.Sequelize.Op.gte]: now },
        { [sequelize.Sequelize.Op.is]: null }
      ]
    };

    return await this.findAll({
      where: whereConditions,
      order: [
        ['priority', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });
  };

  return Banner;
};
