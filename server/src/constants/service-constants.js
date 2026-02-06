/**
 * Service-level constant definitions to centralize shared configuration values.
 */
module.exports = {
  /**
   * Recommendation engine weights, scoring rules, and cache controls.
   */
  RECOMMENDATION: {
    WEIGHT_LIKE: 2.0,
    WEIGHT_COMMENT: 3.0,
    WEIGHT_FAVORITE: 4.0,
    WEIGHT_VIEW: 0.5,
    TIME_DECAY_DAYS: 10,
    MAX_POST_AGE_DAYS: 30,
    SCORE_THRESHOLD: 15.0,
    MAX_ADMIN_RECOMMENDED: 5,
    UPDATE_INTERVAL_HOURS: 1,
    NEW_POST_BONUS: 5.0,
    IMAGE_BONUS: 3.0,
    CONTENT_BONUS: 2.0,
    TOPIC_BONUS: 1.0,
    ENGAGEMENT_FACTOR: 0.2,
    MIN_INTERACTION_SCORE: 2,
    DEFAULT_PAGE_SIZE: 6,
    SETTINGS_CACHE_TTL: 300
  },

  /**
   * Post-related defaults and thresholds for feeds and interactions.
   */
  POST: {
    HOT_COMMENTS_PREVIEW_LIMIT: 2,
    DEFAULT_HOT_POSTS_LIMIT: 10,
    DEFAULT_COMMENTS_PAGE_SIZE: 20,
    DEFAULT_HOT_COMMENTS_LIMIT: 3,
    HOT_COMMENT_LIKE_THRESHOLD: 10,
    DEFAULT_FAVORITES_PAGE_SIZE: 10
  },

  /**
   * User-centric pagination, caching, and query defaults.
   */
  USER: {
    DEFAULT_SEARCH_LIMIT: 10,
    DEFAULT_PROFILE_POSTS_PAGE_SIZE: 10,
    TAGS_CACHE_TTL: 1800,
    DEFAULT_REJECTION_LOGS_LIMIT: 20
  },

  /**
   * Global pagination constraints shared across services.
   */
  PAGINATION: {
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE_SIZE: 10,
    MIN_PAGE: 1
  },

  /**
   * Standardized cache durations for various service layers.
   */
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 1800,
    VERY_LONG: 3600
  }
};
