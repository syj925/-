/**
 * 帖子相关API
 */

export default (http) => ({
  /**
   * 获取帖子列表
   * @param {Object} params 查询参数 (page, pageSize, categoryId, sort, keyword)
   * @returns {Promise}
   */
  getList: (params = {}) => http.get('/api/posts', params),

  /**
   * 获取帖子详情
   * @param {String|Number} id 帖子ID
   * @returns {Promise}
   */
  getDetail: (id) => http.get(`/api/posts/${id}`),

  /**
   * 创建帖子
   * @param {Object} data 帖子数据
   * @returns {Promise}
   */
  create: (data) => http.post('/api/posts', data),

  /**
   * 更新帖子
   * @param {String|Number} id 帖子ID
   * @param {Object} data 帖子数据
   * @returns {Promise}
   */
  update: (id, data) => http.put(`/api/posts/${id}`, data),

  /**
   * 删除帖子
   * @param {String|Number} id 帖子ID
   * @returns {Promise}
   */
  delete: (id) => http.delete(`/api/posts/${id}`),

  /**
   * 获取热门帖子
   * @param {Number} limit 数量限制
   * @returns {Promise}
   */
  getHot: (limit = 10) => http.get('/api/posts/hot', { limit }),

  /**
   * 获取帖子评论
   * @param {String|Number} id 帖子ID
   * @param {Number} page 页码
   * @param {Number} pageSize 每页条数
   * @param {String} sort 排序方式：latest-最新, hot-热门
   * @returns {Promise}
   */
  getComments: (id, page = 1, pageSize = 10, sort = 'latest') => {
    return http.get(`/api/posts/${id}/comments`, { page, pageSize, sort });
  },

  /**
   * 上传图片
   * @param {Object} file 文件对象
   * @returns {Promise}
   */
  uploadImage: (file) => {
    return new Promise((resolve, reject) => {
      // 获取完整的上传URL
      const baseUrl = http.config.baseURL || 'http://localhost:3000';
      const uploadUrl = `${baseUrl}/api/posts/upload`;

      uni.uploadFile({
        url: uploadUrl,
        filePath: file,
        name: 'images',
        header: {
          'Authorization': `Bearer ${uni.getStorageSync('token')}`
        },
        success: (res) => {
          try {
            if (res.statusCode === 200) {
              const data = JSON.parse(res.data);
              if (data.code === 0) {
                resolve(data.data);
              } else {
                uni.showToast({
                  title: data.msg || '上传失败',
                  icon: 'none'
                });
                reject(data);
              }
            } else {
              uni.showToast({
                title: '上传失败',
                icon: 'none'
              });
              reject(res);
            }
          } catch (error) {
            reject(error);
          }
        },
        fail: (error) => {
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          });
          reject(error);
        }
      });
    });
  },

  /**
   * 点赞帖子
   * @param {String} postId 帖子ID
   * @returns {Promise}
   */
  like: (postId) => http.post('/api/likes', {
    target_type: 'post',
    target_id: postId
  }),

  /**
   * 取消点赞帖子
   * @param {String} postId 帖子ID
   * @returns {Promise}
   */
  unlike: (postId) => http.delete(`/api/likes/post/${postId}`),

  /**
   * 收藏帖子
   * @param {String} postId 帖子ID
   * @returns {Promise}
   */
  favorite: (postId) => http.post('/api/favorites', { post_id: postId }),

  /**
   * 取消收藏帖子
   * @param {String} postId 帖子ID
   * @returns {Promise}
   */
  unfavorite: (postId) => http.delete(`/api/favorites/${postId}`)
}); 