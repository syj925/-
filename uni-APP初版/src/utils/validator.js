/**
 * 表单验证工具
 */
const validator = {
  /**
   * 检查字符串是否为空
   * @param {String} str - 要检查的字符串
   * @param {String} fieldName - 字段名称（用于错误提示）
   * @return {Object} 验证结果
   */
  required(str, fieldName = '此项') {
    if (!str || (typeof str === 'string' && str.trim() === '')) {
      return {
        valid: false,
        message: `请输入${fieldName}`
      };
    }
    return { valid: true };
  },
  
  /**
   * 检查字符串长度
   * @param {String} str - 要检查的字符串
   * @param {Number} min - 最小长度
   * @param {Number} max - 最大长度
   * @param {String} fieldName - 字段名称（用于错误提示）
   * @return {Object} 验证结果
   */
  length(str, min, max, fieldName = '此项') {
    if (typeof str !== 'string') {
      return {
        valid: false,
        message: `${fieldName}必须是字符串`
      };
    }
    
    if (str.length < min) {
      return {
        valid: false,
        message: `${fieldName}长度不能少于${min}个字符`
      };
    }
    
    if (max && str.length > max) {
      return {
        valid: false,
        message: `${fieldName}长度不能超过${max}个字符`
      };
    }
    
    return { valid: true };
  },
  
  /**
   * 检查两个字段是否相同
   * @param {String} str1 - 第一个字段
   * @param {String} str2 - 第二个字段
   * @param {String} fieldName - 字段名称（用于错误提示）
   * @return {Object} 验证结果
   */
  same(str1, str2, fieldName = '两项') {
    if (str1 !== str2) {
      return {
        valid: false,
        message: `${fieldName}输入不一致`
      };
    }
    return { valid: true };
  },
  
  /**
   * 检查是否是有效的用户名
   * @param {String} username - 用户名
   * @return {Object} 验证结果
   */
  username(username) {
    // 只允许字母、数字和下划线，长度在3-20之间
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    
    if (!usernameRegex.test(username)) {
      return {
        valid: false,
        message: '用户名只能包含字母、数字和下划线，长度在3-20之间'
      };
    }
    
    return { valid: true };
  },
  
  /**
   * 检查密码强度
   * @param {String} password - 密码
   * @return {Object} 验证结果
   */
  password(password) {
    // 至少包含一个字母和一个数字，长度在6-20之间
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,20}$/;
    
    if (!passwordRegex.test(password)) {
      return {
        valid: false,
        message: '密码必须包含字母和数字，长度在6-20之间'
      };
    }
    
    return { valid: true };
  },
  
  /**
   * 检查是否是有效的电子邮件
   * @param {String} email - 电子邮件
   * @return {Object} 验证结果
   */
  email(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: '请输入有效的电子邮件地址'
      };
    }
    
    return { valid: true };
  }
};

export default validator; 