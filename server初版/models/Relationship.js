const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Relationship = sequelize.define('relationship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    followingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked'),
      defaultValue: 'active'
    }
  }, {
    timestamps: true,
    paranoid: true, // 软删除
    indexes: [
      {
        unique: true,
        fields: ['followerId', 'followingId']
      }
    ]
  });

  // 定义关联关系
  Relationship.associate = function(models) {
    if (models.User) {
      Relationship.belongsTo(models.User, {
        foreignKey: 'followerId',
        as: 'follower'
      });
      
      Relationship.belongsTo(models.User, {
        foreignKey: 'followingId',
        as: 'following'
      });
    }
  };

  return Relationship;
}; 