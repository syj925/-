const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tags', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
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
        type: DataTypes.STRING(20),
        defaultValue: '#409EFF',
        comment: '标签颜色'
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 添加索引
    await queryInterface.addIndex('tags', ['category'], {
      name: 'idx_tags_category'
    });
    
    await queryInterface.addIndex('tags', ['status'], {
      name: 'idx_tags_status'
    });
    
    await queryInterface.addIndex('tags', ['use_count'], {
      name: 'idx_tags_use_count'
    });

    await queryInterface.addIndex('tags', ['sort_order'], {
      name: 'idx_tags_sort_order'
    });

    await queryInterface.addIndex('tags', ['deleted_at'], {
      name: 'idx_tags_deleted_at'
    });

    // 插入一些初始标签数据
    await queryInterface.bulkInsert('tags', [
      // 兴趣爱好类
      {
        id: 'tag_interest_music',
        name: '音乐',
        category: 'interest',
        description: '喜欢音乐的用户',
        color: '#FF6B6B',
        status: 'hot',
        sort_order: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_interest_sports',
        name: '体育运动',
        category: 'interest',
        description: '热爱体育运动的用户',
        color: '#4ECDC4',
        status: 'hot',
        sort_order: 90,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_interest_reading',
        name: '阅读',
        category: 'interest',
        description: '喜欢阅读的用户',
        color: '#45B7D1',
        status: 'normal',
        sort_order: 80,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_interest_gaming',
        name: '游戏',
        category: 'interest',
        description: '游戏爱好者',
        color: '#F39C12',
        status: 'normal',
        sort_order: 70,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // 专业技能类
      {
        id: 'tag_skill_programming',
        name: '编程',
        category: 'skill',
        description: '具备编程技能的用户',
        color: '#9B59B6',
        status: 'hot',
        sort_order: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_skill_design',
        name: '设计',
        category: 'skill',
        description: '具备设计技能的用户',
        color: '#E74C3C',
        status: 'normal',
        sort_order: 90,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_skill_photography',
        name: '摄影',
        category: 'skill',
        description: '具备摄影技能的用户',
        color: '#2ECC71',
        status: 'normal',
        sort_order: 80,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // 学院专业类
      {
        id: 'tag_major_cs',
        name: '计算机科学',
        category: 'major',
        description: '计算机科学专业的学生',
        color: '#3498DB',
        status: 'normal',
        sort_order: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_major_business',
        name: '工商管理',
        category: 'major',
        description: '工商管理专业的学生',
        color: '#34495E',
        status: 'normal',
        sort_order: 90,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_major_art',
        name: '艺术设计',
        category: 'major',
        description: '艺术设计专业的学生',
        color: '#E67E22',
        status: 'normal',
        sort_order: 80,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // 年级类
      {
        id: 'tag_grade_freshman',
        name: '大一',
        category: 'grade',
        description: '大一学生',
        color: '#1ABC9C',
        status: 'normal',
        sort_order: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_grade_sophomore',
        name: '大二',
        category: 'grade',
        description: '大二学生',
        color: '#16A085',
        status: 'normal',
        sort_order: 90,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_grade_junior',
        name: '大三',
        category: 'grade',
        description: '大三学生',
        color: '#27AE60',
        status: 'normal',
        sort_order: 80,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_grade_senior',
        name: '大四',
        category: 'grade',
        description: '大四学生',
        color: '#229954',
        status: 'normal',
        sort_order: 70,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // 其他类
      {
        id: 'tag_other_volunteer',
        name: '志愿者',
        category: 'other',
        description: '积极参与志愿活动的用户',
        color: '#D35400',
        status: 'normal',
        sort_order: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tag_other_traveler',
        name: '旅行爱好者',
        category: 'other',
        description: '喜欢旅行的用户',
        color: '#8E44AD',
        status: 'normal',
        sort_order: 90,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tags');
  }
};
