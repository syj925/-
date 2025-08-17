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
      paranoid: true, // 启用软删除
      indexes: [
        {
          fields: ['userId']  // 使用模型字段名，Sequelize会自动转换
        },
        {
          fields: ['keyword']
        },
        {
          fields: ['userId', 'keyword'],  // 同一用户的同一关键词只能有一条记录
          unique: true
        },
        {
          fields: ['createdAt']  // 使用模型字段名
        },
        {
          fields: ['updatedAt']  // 使用模型字段名
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
