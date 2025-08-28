/**
 * 推荐算法预设配置
 * 为不同环境和场景提供优化的配置模板
 */

const RecommendationPresets = {
  /**
   * 🔧 开发模式配置
   * 特点：宽松的推荐条件，便于测试和调试
   */
  development: {
    name: "开发模式",
    description: "宽松的推荐条件，便于测试功能",
    settings: {
      // 🎯 基础权重配置 (较为宽松)
      likeWeight: 1.5,           // 点赞权重
      commentWeight: 2.5,        // 评论权重  
      collectionWeight: 3.0,     // 收藏权重
      viewWeight: 0.3,           // 浏览权重
      timeDecayDays: 7,          // 时间衰减周期 (较长)
      maxAgeDays: 30,            // 最大处理天数 (较长)
      
      // 🎛️ 推荐策略配置
      scoreThreshold: 5.0,       // 推荐分数阈值 (较低)
      maxAdminRecommended: 3,    // 管理员推荐最大数量
      enableScoreSort: true,     // 启用分数排序
      minInteractionScore: 2.0,  // 最低互动分数
      strategy: "mixed",         // 混合策略
      
      // 🎨 质量评估配置
      newPostBonus: 8.0,         // 新帖子额外分数 (较高)
      imageBonus: 4.0,           // 图片内容额外分数
      contentBonus: 3.0,         // 长文本额外分数  
      topicBonus: 2.0,           // 话题标签额外分数
      engagementFactor: 0.3,     // 互动量因子
      
      // 🔄 多样性控制配置
      maxSameAuthorRatio: 0.4,   // 同作者最大占比 (较宽松)
      diversityPeriodHours: 48,  // 多样性检查周期
      
      // ⏰ 更新频率配置
      updateIntervalHours: 0.5,  // 更新间隔 (较频繁)
      
      // 🏪 缓存配置
      enableCache: true,
      cacheExpireMinutes: 10,    // 缓存时间 (较短)
      
      // 🔍 搜索页推荐配置
      searchPageRecommendCount: 5,
      enableSearchPageRecommend: true,
      searchRecommendTypes: ["post", "topic"]
    }
  },

  /**
   * 🚀 生产模式配置
   * 特点：平衡的推荐质量和数量，适合正式环境
   */
  production: {
    name: "生产模式",
    description: "平衡质量和数量，适合正式运营环境",
    settings: {
      // 🎯 基础权重配置 (平衡优化)
      likeWeight: 2.0,
      commentWeight: 3.0,
      collectionWeight: 4.0,
      viewWeight: 0.5,
      timeDecayDays: 5,          // 时间衰减周期 (适中)
      maxAgeDays: 14,            // 最大处理天数 (适中)
      
      // 🎛️ 推荐策略配置
      scoreThreshold: 12.0,      // 推荐分数阈值 (适中)
      maxAdminRecommended: 2,    // 管理员推荐最大数量
      enableScoreSort: true,
      minInteractionScore: 4.0,  // 最低互动分数 (较高)
      strategy: "mixed",
      
      // 🎨 质量评估配置
      newPostBonus: 5.0,         // 新帖子额外分数 (适中)
      imageBonus: 3.0,
      contentBonus: 2.0,
      topicBonus: 1.0,
      engagementFactor: 0.2,
      
      // 🔄 多样性控制配置
      maxSameAuthorRatio: 0.3,   // 同作者最大占比 (适中)
      diversityPeriodHours: 24,
      
      // ⏰ 更新频率配置  
      updateIntervalHours: 2,    // 更新间隔 (适中)
      
      // 🏪 缓存配置
      enableCache: true,
      cacheExpireMinutes: 30,    // 缓存时间 (较长)
      
      // 🔍 搜索页推荐配置
      searchPageRecommendCount: 3,
      enableSearchPageRecommend: true,
      searchRecommendTypes: ["post"]
    }
  },

  /**
   * 🔥 高质量模式配置
   * 特点：严格的推荐标准，确保高质量内容
   */
  highQuality: {
    name: "高质量模式", 
    description: "严格的推荐标准，确保推荐内容质量",
    settings: {
      // 🎯 基础权重配置 (注重质量)
      likeWeight: 2.5,
      commentWeight: 4.0,        // 重视评论互动
      collectionWeight: 5.0,     // 重视收藏行为
      viewWeight: 0.3,           // 降低浏览权重
      timeDecayDays: 3,          // 时间衰减快
      maxAgeDays: 7,             // 只处理最新内容
      
      // 🎛️ 推荐策略配置
      scoreThreshold: 18.0,      // 推荐分数阈值 (较高)
      maxAdminRecommended: 1,    
      enableScoreSort: true,
      minInteractionScore: 6.0,  // 最低互动分数 (高)
      strategy: "algorithm",     // 纯算法推荐
      
      // 🎨 质量评估配置
      newPostBonus: 3.0,         // 降低新帖子优势
      imageBonus: 2.0,
      contentBonus: 4.0,         // 重视内容质量
      topicBonus: 1.5,
      engagementFactor: 0.15,
      
      // 🔄 多样性控制配置
      maxSameAuthorRatio: 0.2,   // 严格控制同作者
      diversityPeriodHours: 12,
      
      // ⏰ 更新频率配置
      updateIntervalHours: 4,    // 更新较慢
      
      // 🏪 缓存配置
      enableCache: true,
      cacheExpireMinutes: 60,    // 长缓存
      
      // 🔍 搜索页推荐配置
      searchPageRecommendCount: 2,
      enableSearchPageRecommend: false, // 关闭搜索页推荐
      searchRecommendTypes: []
    }
  },

  /**
   * 🎊 活跃模式配置
   * 特点：鼓励更多内容推荐，提升社区活跃度
   */
  active: {
    name: "活跃模式",
    description: "鼓励更多推荐，提升社区活跃度",
    settings: {
      // 🎯 基础权重配置 (活跃导向)
      likeWeight: 1.8,
      commentWeight: 2.0,
      collectionWeight: 3.5,
      viewWeight: 0.8,           // 提高浏览权重
      timeDecayDays: 10,         // 时间衰减慢
      maxAgeDays: 21,            // 处理更久的内容
      
      // 🎛️ 推荐策略配置
      scoreThreshold: 8.0,       // 推荐分数阈值 (较低)
      maxAdminRecommended: 5,    // 更多管理员推荐
      enableScoreSort: true,
      minInteractionScore: 3.0,
      strategy: "mixed",
      
      // 🎨 质量评估配置
      newPostBonus: 6.0,         // 鼓励新内容
      imageBonus: 3.5,
      contentBonus: 2.5,
      topicBonus: 2.5,           // 鼓励话题参与
      engagementFactor: 0.25,
      
      // 🔄 多样性控制配置
      maxSameAuthorRatio: 0.35,
      diversityPeriodHours: 36,
      
      // ⏰ 更新频率配置
      updateIntervalHours: 1,    // 频繁更新
      
      // 🏪 缓存配置
      enableCache: true,
      cacheExpireMinutes: 15,
      
      // 🔍 搜索页推荐配置
      searchPageRecommendCount: 8,
      enableSearchPageRecommend: true,
      searchRecommendTypes: ["post", "topic", "user"]
    }
  }
};

module.exports = RecommendationPresets;
