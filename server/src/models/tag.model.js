module.exports = (sequelize, DataTypes) => {
const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '标签名称'
  },
  category: {
    type: DataTypes.ENUM('interest', 'skill', 'major', 'grade', 'other'),
    allowNull: false,
    defaultValue: 'interest',
    comment: '标签分类'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '标签描述'
  },
  color: {
    type: DataTypes.STRING(30),
    defaultValue: '#409EFF',
    comment: '标签颜色（支持HEX和RGBA格式）'
  },
  status: {
    type: DataTypes.ENUM('hot', 'normal', 'disabled'),
    defaultValue: 'normal',
    comment: '标签状态'
  },
  use_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序权重'
  },
  deleted_at: {
    type: DataTypes.DATE,
    comment: '软删除时间'
  }
}, {
  tableName: 'tags',
  paranoid: true,
  deletedAt: 'deleted_at',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['status']
    },
    {
      fields: ['use_count']
    }
  ]
});

return Tag;
};
