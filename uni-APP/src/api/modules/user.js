/**
 * 用户相关API
 */

export default (http) => ({
  /**
   * 登录
   * @param {Object} data 登录数据
   * @returns {Promise}
   */
  login: (data) => {
    return http.post('/api/auth/login', data);
  },

  /**
   * 注册
   * @param {Object} data 注册数据
   * @returns {Promise}
   */
  register: (data) => {
    return http.post('/api/auth/register', data);
  },

  /**
   * 获取当前用户信息
   * @returns {Promise}
   */
  getInfo: () => {
    return http.get('/api/users/me');
  },

  /**
   * 获取指定用户信息
   * @param {String} id 用户ID
   * @returns {Promise}
   */
  getUserInfo: (id) => {
    return http.get(`/api/users/${id}`);
  },

  /**
   * 更新用户信息
   * @param {Object} data 用户信息
   * @returns {Promise}
   */
  updateInfo: (data) => http.put('/api/users/me', data),

  /**
   * 修改密码
   * @param {Object} data 包含旧密码和新密码
   * @returns {Promise}
   */
  changePassword: (data) => {
    return http.post('/api/users/change-password', data);
  },

  /**
   * 获取用户发布的帖子列表
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @param {String} type 类型：published-已发布, drafts-草稿
   * @returns {Promise}
   */
  getPosts: (page = 1, pageSize = 10, type = 'published') => {
    return http.get('/api/posts/user/me', { page, pageSize, type });
  },

  /**
   * 获取用户收藏的帖子
   * @param {Number} page 页码
   * @param {Number} pageSize 每页数量
   * @returns {Promise}
   */
  getFavorites: (page = 1, pageSize = 10) => {
    return http.get('/api/favorites/user/me', { page, pageSize });
  },

  /**
   * 搜索用户（支持@功能）
   * @param {Object} params 搜索参数
   * @returns {Promise}
   */
  searchUsers: (params) => {
    return http.get('/api/users/search', params);
  },

  /**
   * 检查Token有效性
   * @returns {Promise}
   */
  checkToken: () => {
    return http.get('/api/user/checkToken');
  },

  /**
   * 发送手机验证码
   * @param {Object} data 包含手机号
   * @returns {Promise}
   */
  sendPhoneCode: (data) => {
    return http.post('/users/sms/code', data);
  },

  /**
   * 获取用户设置
   * @returns {Promise}
   */
  getSettings: () => {
    return http.get('/api/settings');
  },

  /**
   * 更新用户设置
   * @param {Object} settings 设置数据
   * @returns {Promise}
   */
  updateSettings: (settings) => {
    return http.put('/api/settings', settings);
  },

  /**
   * 获取隐私设置
   * @returns {Promise}
   */
  getPrivacySettings: () => {
    return http.get('/api/settings/privacy');
  },

  /**
   * 更新隐私设置
   * @param {Object} privacySettings 隐私设置数据
   * @returns {Promise}
   */
  updatePrivacySettings: (privacySettings) => {
    return http.put('/api/settings/privacy', privacySettings);
  }
});