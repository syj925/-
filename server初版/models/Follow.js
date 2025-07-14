/**
 * 关注模型
 * 用于记录用户之间的关注关系
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * 定义Follow模型
   */
  const Follow = sequelize.define('Follow', {
    // 关注关系ID
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    // 关注者ID（主动关注的用户）
    followerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'follower_id'
    },
    // 被关注者ID（被关注的用户）
    followingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'following_id'
    },
    // 备注名（可选）
    remark: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '关注备注',
      field: 'remark'
    }
  }, {
    // 模型选项
    sequelize,
    modelName: 'Follow',
    tableName: 'follows',
    underscored: true,
    timestamps: true,
    paranoid: true, // 软删除
    indexes: [
      // 复合索引，提高查询性能并确保不重复关注
      {
        name: 'follows_user_relation_index',
        unique: true,
        fields: ['follower_id', 'following_id']
      },
      {
        name: 'follows_follower_id_index',
        fields: ['follower_id']
      },
      {
        name: 'follows_following_id_index',
        fields: ['following_id']
      }
    ]
  });

  /**
   * 定义关联关系
   * @param {Object} models - 所有模型的集合
   */
  Follow.associate = (models) => {
    // 关注关系与关注者的关系
    Follow.belongsTo(models.User, {
      foreignKey: 'followerId',
      as: 'follower'
    });

    // 关注关系与被关注者的关系
    Follow.belongsTo(models.User, {
      foreignKey: 'followingId',
      as: 'following'
    });
  };

  return Follow;
}; 