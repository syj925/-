module.exports = (sequelize, DataTypes) => {
  const SearchHistory = sequelize.define(
    'SearchHistory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '搜索历史ID'
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '用户ID',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      keyword: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '搜索关键词'
      },
      type: {
        type: DataTypes.ENUM('all', 'posts', 'users', 'topics'),
        allowNull: false,
        defaultValue: 'all',
        comment: '搜索类型'
      }
    },
    {
      tableName: 'search_histories',
      timestamps: true,
      indexes: [
        {
          fields: ['userId']
        },
        {
          fields: ['keyword']
        },
        {
          fields: ['userId', 'keyword', 'type'],
          unique: true
        },
        {
          fields: ['createdAt']
        },
        {
          fields: ['updatedAt']
        }
      ],
      comment: '搜索历史表'
    }
  );

  /**
   * 定义关联关系
   */
  SearchHistory.associate = function(models) {
    // 搜索历史属于用户
    SearchHistory.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return SearchHistory;
};
