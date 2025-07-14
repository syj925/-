module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 50]
        }
      },
      icon: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      sort: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: 'categories',
      timestamps: true,
      underscored: true
    }
  );

  // 定义关联关系
  Category.associate = models => {
    // 分类与帖子是一对多关系
    Category.hasMany(models.Post, {
      foreignKey: 'category_id',
      as: 'posts'
    });
  };

  return Category;
}; 