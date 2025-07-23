/**
 * API辅助工具
 * 提供统一的API调用和数据处理方法
 */

import { 
  isApiSuccess, 
  getApiMessage, 
  getApiData,
  transformToBackend,
  transformToFrontend,
  formatPaginationParams
} from '@/config/api-config';

/**
 * 统一的API响应处理
 * @param {Function} apiCall API调用函数
 * @param {Object} options 选项
 * @returns {Promise} 处理后的响应
 */
export async function handleApiCall(apiCall, options = {}) {
  const { 
    transformRequest = null,
    transformResponse = null,
    category = 'event',
    showError = true 
  } = options;

  try {
    // 转换请求数据
    let requestData = apiCall;
    if (transformRequest && typeof transformRequest === 'object') {
      requestData = transformToBackend(transformRequest, category);
    }

    // 执行API调用
    const response = typeof apiCall === 'function' ? await apiCall() : await apiCall;

    // 检查响应是否成功
    if (isApiSuccess(response)) {
      let data = getApiData(response);
      
      // 转换响应数据
      if (transformResponse && data) {
        if (Array.isArray(data)) {
          data = data.map(item => transformToFrontend(item, category));
        } else if (typeof data === 'object') {
          data = transformToFrontend(data, category);
        }
      }

      return {
        success: true,
        data,
        message: getApiMessage(response)
      };
    } else {
      const errorMessage = getApiMessage(response);
      if (showError) {
        console.error('API调用失败:', errorMessage);
      }
      return {
        success: false,
        data: null,
        message: errorMessage
      };
    }
  } catch (error) {
    const errorMessage = error.message || '网络错误，请检查网络连接';
    if (showError) {
      console.error('API调用异常:', error);
    }
    return {
      success: false,
      data: null,
      message: errorMessage
    };
  }
}

/**
 * 处理列表API响应
 * @param {Function} apiCall API调用函数
 * @param {Object} params 查询参数
 * @param {String} category 数据类别
 * @returns {Promise} 处理后的列表响应
 */
export async function handleListApi(apiCall, params = {}, category = 'event') {
  const formattedParams = formatPaginationParams(params);
  
  const result = await handleApiCall(
    () => apiCall(formattedParams),
    { 
      category,
      transformResponse: true 
    }
  );

  if (result.success && result.data) {
    // 转换列表数据
    const { events, posts, users, comments, ...rest } = result.data;
    const listKey = events ? 'events' : posts ? 'posts' : users ? 'users' : comments ? 'comments' : 'list';
    const listData = result.data[listKey] || [];

    return {
      ...result,
      data: {
        ...rest,
        [listKey]: listData.map(item => transformToFrontend(item, category)),
        pagination: result.data.pagination || {}
      }
    };
  }

  return result;
}

/**
 * 处理创建/更新API
 * @param {Function} apiCall API调用函数
 * @param {Object} data 数据
 * @param {String} category 数据类别
 * @returns {Promise} 处理后的响应
 */
export async function handleMutationApi(apiCall, data, category = 'event') {
  const transformedData = transformToBackend(data, category);
  
  return await handleApiCall(
    () => apiCall(transformedData),
    { 
      category,
      transformResponse: true 
    }
  );
}

/**
 * 处理详情API
 * @param {Function} apiCall API调用函数
 * @param {String} id 资源ID
 * @param {String} category 数据类别
 * @returns {Promise} 处理后的响应
 */
export async function handleDetailApi(apiCall, id, category = 'event') {
  const result = await handleApiCall(
    () => apiCall(id),
    { 
      category,
      transformResponse: true 
    }
  );

  if (result.success && result.data) {
    result.data = transformToFrontend(result.data, category);
  }

  return result;
}

/**
 * 处理删除API
 * @param {Function} apiCall API调用函数
 * @param {String} id 资源ID
 * @returns {Promise} 处理后的响应
 */
export async function handleDeleteApi(apiCall, id) {
  return await handleApiCall(() => apiCall(id));
}

/**
 * 批量处理API调用
 * @param {Array} apiCalls API调用数组
 * @param {Object} options 选项
 * @returns {Promise} 批量处理结果
 */
export async function handleBatchApi(apiCalls, options = {}) {
  const { category = 'event', transformResponse = true } = options;
  
  try {
    const results = await Promise.allSettled(
      apiCalls.map(apiCall => 
        handleApiCall(apiCall, { category, transformResponse })
      )
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    );
    
    const failed = results.filter(result => 
      result.status === 'rejected' || !result.value.success
    );

    return {
      success: failed.length === 0,
      successful: successful.length,
      failed: failed.length,
      total: results.length,
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { 
          success: false, 
          message: result.reason?.message || '操作失败' 
        }
      )
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '批量操作失败',
      successful: 0,
      failed: apiCalls.length,
      total: apiCalls.length,
      results: []
    };
  }
}

/**
 * 创建统一的API调用器
 * @param {Object} api 原始API对象
 * @param {String} category 数据类别
 * @returns {Object} 包装后的API对象
 */
export function createApiWrapper(api, category = 'event') {
  return {
    // 列表查询
    getList: (params) => handleListApi(api.getList, params, category),
    
    // 详情查询
    getDetail: (id) => handleDetailApi(api.getDetail, id, category),
    
    // 创建
    create: (data) => handleMutationApi(api.create, data, category),
    
    // 更新
    update: (id, data) => handleMutationApi((data) => api.update(id, data), data, category),
    
    // 删除
    delete: (id) => handleDeleteApi(api.delete, id),
    
    // 原始API方法（如果需要直接调用）
    raw: api
  };
}

export default {
  handleApiCall,
  handleListApi,
  handleMutationApi,
  handleDetailApi,
  handleDeleteApi,
  handleBatchApi,
  createApiWrapper
};
