/**
 * 分类相关API
 */

export default (http) => ({
  /**
   * 获取分类列表
   * @returns {Promise}
   */
  getList: () => http.get('/content/categories/type/post'),

  /**
   * 获取分类详情
   * @param {String|Number} id 分类ID
   * @returns {Promise}
   */
  getDetail: (id) => http.get(`/api/categories/${id}`)
}); 