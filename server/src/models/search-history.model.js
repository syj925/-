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
          fields: ['user_id']  // 使用数据库实际字段名
        },
        {
          fields: ['keyword']
        },
        {
          fields: ['user_id', 'keyword', 'type'],  // 使用数据库实际字段名
          unique: true
        },
        {
          fields: ['created_at']  // 使用数据库实际字段名
        },
        {
          fields: ['updated_at']  // 使用数据库实际字段名
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
