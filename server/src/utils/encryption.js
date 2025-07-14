const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * 加密工具类
 */
class EncryptionUtil {
  /**
   * 对密码进行哈希
   * @param {String} password 明文密码
   * @returns {String} 哈希后的密码
   */
  static hashPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  /**
   * 验证密码
   * @param {String} password 明文密码
   * @param {String} hash 哈希后的密码
   * @returns {Boolean} 是否匹配
   */
  static verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  /**
   * 生成随机字符串
   * @param {Number} length 字符串长度
   * @returns {String} 随机字符串
   */
  static generateRandomString(length = 16) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * 生成数字验证码
   * @param {Number} length 验证码长度
   * @returns {String} 数字验证码
   */
  static generateVerifyCode(length = 6) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * 生成MD5哈希
   * @param {String} content 内容
   * @returns {String} MD5哈希值
   */
  static md5(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 生成SHA256哈希
   * @param {String} content 内容
   * @returns {String} SHA256哈希值
   */
  static sha256(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

module.exports = EncryptionUtil; 