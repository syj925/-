const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * JWT工具类
 */
class JwtUtil {
  /**
   * 生成token
   * @param {Object} payload 载荷数据
   * @returns {String} token字符串
   */
  static generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: config.jwt.algorithm,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  }

  /**
   * 验证token
   * @param {String} token token字符串
   * @returns {Object|null} 解析后的payload或null
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * 解析token（不验证签名）
   * @param {String} token token字符串
   * @returns {Object|null} 解析后的payload或null
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (err) {
      return null;
    }
  }
}

module.exports = JwtUtil; 