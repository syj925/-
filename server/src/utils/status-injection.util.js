const StatusInjectionUtil = {
  /**
   * Inject like/favorite/following status into a list of posts for a specific user.
   * @param {Array<Object>} posts Post instances array (Sequelize models)
   * @param {String|null} userId Current user ID
   * @param {Object} statusCacheService Status cache service with isLiked/isFavorited/isFollowing
   * @returns {Promise<void>}
   */
  async injectPostStatus(posts, userId, statusCacheService) {
    if (!Array.isArray(posts) || posts.length === 0) {
      return;
    }

    if (!userId) {
      posts.forEach(post => this._setDefaultStatus(post));
      return;
    }

    const postIds = posts.map(post => post?.id).filter(Boolean);
    const authorIds = posts.map(post => post?.author?.id).filter(Boolean);

    if (postIds.length === 0) {
      posts.forEach(post => this._setDefaultStatus(post));
      return;
    }

    const likePromise = statusCacheService.isLiked(userId, postIds);
    const favoritePromise = statusCacheService.isFavorited(userId, postIds);
    const followingPromise = authorIds.length > 0
      ? statusCacheService.isFollowing(userId, authorIds)
      : Promise.resolve({});

    const [likeStates = {}, favoriteStates = {}, followingStates = {}] = await Promise.all([
      likePromise,
      favoritePromise,
      followingPromise
    ]);

    posts.forEach(post => {
      this._injectStatus(post, likeStates, favoriteStates, followingStates);
    });
  },

  /**
   * Inject like/favorite/following status into a single post instance.
   * @param {Object} post Post instance (Sequelize model)
   * @param {String|null} userId Current user ID
   * @param {Object} statusCacheService Status cache service with isLiked/isFavorited/isFollowing
   * @returns {Promise<void>}
   */
  async injectSinglePostStatus(post, userId, statusCacheService) {
    if (!post) {
      return;
    }

    if (!userId || !post.id) {
      this._setDefaultStatus(post);
      return;
    }

    const authorId = post.author?.id;

    const [likeStates = {}, favoriteStates = {}, followingStates = {}] = await Promise.all([
      statusCacheService.isLiked(userId, [post.id]),
      statusCacheService.isFavorited(userId, [post.id]),
      authorId ? statusCacheService.isFollowing(userId, [authorId]) : Promise.resolve({})
    ]);

    this._injectStatus(post, likeStates, favoriteStates, followingStates);
  },

  /**
   * Internal helper to inject calculated states onto a post instance.
   * @param {Object} post Post instance
   * @param {Object} likeStates Like status map keyed by post ID
   * @param {Object} favoriteStates Favorite status map keyed by post ID
   * @param {Object} followingStates Following status map keyed by author ID
   * @private
   */
  _injectStatus(post, likeStates = {}, favoriteStates = {}, followingStates = {}) {
    if (!post) {
      return;
    }

    post.dataValues = post.dataValues || {};

    const likeValue = likeStates[post.id] || false;
    const favoriteValue = favoriteStates[post.id] || false;

    post.dataValues.is_liked = likeValue;
    post.dataValues.is_favorited = favoriteValue;

    post.is_liked = likeValue;
    post.is_favorited = favoriteValue;

    post.isLiked = likeValue;
    post.isFavorited = favoriteValue;

    if (post.author && post.author.id) {
      post.author.dataValues = post.author.dataValues || {};
      post.author.dataValues.isFollowing = followingStates[post.author.id] || false;
    }
  },

  /**
   * Internal helper to set default false states when user context is missing.
   * @param {Object} post Post instance
   * @private
   */
  _setDefaultStatus(post) {
    if (!post) {
      return;
    }

    post.dataValues = post.dataValues || {};

    post.dataValues.is_liked = false;
    post.dataValues.is_favorited = false;

    post.is_liked = false;
    post.is_favorited = false;

    post.isLiked = false;
    post.isFavorited = false;

    if (post.author) {
      post.author.dataValues = post.author.dataValues || {};
      post.author.dataValues.isFollowing = false;
    }
  }
};

module.exports = StatusInjectionUtil;
