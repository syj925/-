const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const PostImage = sequelize.define(
    'PostImage',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: () => uuidv4(),
        allowNull: false
      },
      post_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id'
        }
      },
      url: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      thumbnail_url: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      width: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      height: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: 'post_images',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['post_id']
        }
      ]
    }
  );

  // 定义关联关系
  PostImage.associate = models => {
    // 图片与帖子是多对一关系
    PostImage.belongsTo(models.Post, {
      foreignKey: 'post_id',
      as: 'post'
    });
  };

  return PostImage;
}; 