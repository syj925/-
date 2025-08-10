/**
 * 日期格式化函数
 * @param {Date|string|number} date 需要格式化的日期
 * @param {string} format 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';
  
  // 如果是时间戳(数字)或者字符串，转为Date对象
  if (typeof date !== 'object') {
    date = new Date(date);
  }
  
  // 如果是无效日期
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // 补零函数
  const padZero = (num) => (num < 10 ? '0' + num : num);
  
  return format
    .replace(/YYYY/g, year)
    .replace(/MM/g, padZero(month))
    .replace(/DD/g, padZero(day))
    .replace(/HH/g, padZero(hours))
    .replace(/mm/g, padZero(minutes))
    .replace(/ss/g, padZero(seconds));
}

/**
 * 格式化文件大小
 * @param {number} bytes 文件大小(字节)
 * @param {number} decimals 小数位数，默认为2
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 格式化数字(加千分位)
 * @param {number} num 需要格式化的数字
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化用户角色
 * @param {string} role 角色英文名
 * @returns {string} 角色中文名
 */
export function formatRole(role) {
  const roleMap = {
    'user': '普通用户',
    'admin': '管理员',
    'student': '学生',
    'teacher': '教师',
    'staff': '教职工',
    'moderator': '版主',
    'guest': '访客'
  };
  return roleMap[role] || role;
}

/**
 * 格式化用户状态
 * @param {string} status 状态英文名
 * @returns {string} 状态中文名
 */
export function formatStatus(status) {
  const statusMap = {
    'active': '正常',
    'inactive': '未激活',
    'banned': '禁用',
    'pending': '待审核',
    'suspended': '暂停',
    'deleted': '已删除'
  };
  return statusMap[status] || status;
}

/**
 * 获取状态标签类型
 * @param {string} status 状态值
 * @returns {string} Element Plus 标签类型
 */
export function getStatusTagType(status) {
  const typeMap = {
    'active': 'success',
    'banned': 'danger',
    'deleted': 'danger',
    'suspended': 'warning',
    'inactive': 'warning',
    'pending': 'info'
  };
  return typeMap[status] || 'info';
}

/**
 * 格式化ID显示（显示前8位）
 * @param {string} id 完整ID
 * @returns {string} 格式化后的ID
 */
export function formatId(id) {
  if (!id) return '';
  return id.substring(0, 8) + '...';
}

/**
 * 格式化图片URL，确保返回完整的绝对URL
 * @param {string} imageUrl 图片URL
 * @param {string} serverBaseUrl 服务器基础URL，默认为 'http://localhost:3000'
 * @returns {string} 完整的图片URL
 */
export function formatImageUrl(imageUrl, serverBaseUrl = 'http://localhost:3000') {
  if (!imageUrl) return '';

  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 如果是相对路径，拼接服务器地址
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${serverBaseUrl}${path}`;
}