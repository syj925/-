const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../utils');
const logger = require('../../config/logger');

/**
 * 内容长度验证中间件
 */
class ContentLengthMiddleware {
  /**
   * 获取内容长度设置（动态创建）
   * @returns {Promise<Object>} 内容长度设置
   */
  static async getContentLengthSettings() {
    try {
      const { Setting } = require('../models');

      // 动态创建或获取最小帖子长度
      const [minLengthSetting] = await Setting.findOrCreate({
        where: { key: 'minPostLength' },
        defaults: {
          key: 'minPostLength',
          value: '5',
          description: '帖子最小字数',
          type: 'number',
          is_system: true
        }
      });

      // 动态创建或获取最大帖子长度
      const [maxLengthSetting] = await Setting.findOrCreate({
        where: { key: 'maxPostLength' },
        defaults: {
          key: 'maxPostLength',
          value: '1000',
          description: '帖子最大字数',
          type: 'number',
          is_system: true
        }
      });

      return {
        minPostLength: parseInt(minLengthSetting.value, 10) || 5,
        maxPostLength: parseInt(maxLengthSetting.value, 10) || 1000
      };
    } catch (error) {
      logger.error('获取内容长度设置失败:', error);
      return {
        minPostLength: 5,
        maxPostLength: 1000
      };
    }
  }

  /**
   * 计算文本实际长度（排除空白字符）
   * @param {String} text 文本内容
   * @returns {Number} 实际长度
   */
  static getActualLength(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    
    // 移除首尾空白，并计算长度
    return text.trim().length;
  }

  /**
   * 帖子内容长度验证中间件
   * @param {String} contentField 内容字段名，默认为'content'
   * @returns {Function} Express中间件
   */
  static validatePostLength(contentField = 'content') {
    return async (req, res, next) => {
      try {
        console.log('🔍 ContentLengthMiddleware.validatePostLength 被调用');
        console.log('请求体:', JSON.stringify(req.body, null, 2));

        // 获取内容长度设置
        const settings = await this.getContentLengthSettings();
        console.log('长度设置:', settings);
        
        // 获取要验证的内容
        const content = req.body[contentField];
        
        if (!content || typeof content !== 'string') {
          return res.status(StatusCodes.BAD_REQUEST).json(
            ResponseUtil.error('内容不能为空', StatusCodes.BAD_REQUEST, {
              errorType: 'CONTENT_REQUIRED',
              field: contentField,
              message: '请输入内容'
            })
          );
        }

        // 计算实际长度
        const actualLength = this.getActualLength(content);
        
        // 验证最小长度
        if (actualLength < settings.minPostLength) {
          logger.warn('内容长度不足', {
            userId: req.user?.id,
            actualLength,
            minRequired: settings.minPostLength,
            field: contentField
          });

          return res.status(StatusCodes.BAD_REQUEST).json(
            ResponseUtil.error('内容长度不足', StatusCodes.BAD_REQUEST, {
              errorType: 'CONTENT_TOO_SHORT',
              field: contentField,
              actualLength,
              minRequired: settings.minPostLength,
              message: `内容至少需要${settings.minPostLength}个字符，当前只有${actualLength}个字符`
            })
          );
        }

        // 验证最大长度
        if (actualLength > settings.maxPostLength) {
          logger.warn('内容长度超限', {
            userId: req.user?.id,
            actualLength,
            maxAllowed: settings.maxPostLength,
            field: contentField
          });

          return res.status(StatusCodes.BAD_REQUEST).json(
            ResponseUtil.error('内容长度超限', StatusCodes.BAD_REQUEST, {
              errorType: 'CONTENT_TOO_LONG',
              field: contentField,
              actualLength,
              maxAllowed: settings.maxPostLength,
              message: `内容最多允许${settings.maxPostLength}个字符，当前有${actualLength}个字符`
            })
          );
        }

        // 验证通过，添加长度信息到请求对象
        req.contentLengthInfo = {
          field: contentField,
          actualLength,
          minRequired: settings.minPostLength,
          maxAllowed: settings.maxPostLength,
          valid: true
        };

        next();

      } catch (error) {
        logger.error('内容长度验证中间件错误:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
          ResponseUtil.error('内容验证失败', StatusCodes.INTERNAL_SERVER_ERROR, {
            errorType: 'VALIDATION_ERROR',
            message: '系统错误，请稍后再试'
          })
        );
      }
    };
  }

  /**
   * 评论内容长度验证中间件（相对宽松）
   * @param {String} contentField 内容字段名，默认为'content'
   * @returns {Function} Express中间件
   */
  static validateCommentLength(contentField = 'content') {
    return async (req, res, next) => {
      try {
        // 评论的长度限制相对宽松
        const minLength = 1;
        const maxLength = 500;
        
        // 获取要验证的内容
        const content = req.body[contentField];
        
        if (!content || typeof content !== 'string') {
          return res.status(StatusCodes.BAD_REQUEST).json(
            ResponseUtil.error('评论内容不能为空', StatusCodes.BAD_REQUEST, {
              errorType: 'CONTENT_REQUIRED',
              field: contentField,
              message: '请输入评论内容'
            })
          );
        }

        // 计算实际长度
        const actualLength = this.getActualLength(content);
        
        // 验证最小长度
        if (actualLength < minLength) {
          return res.status(StatusCodes.BAD_REQUEST).json(
            ResponseUtil.error('评论内容不能为空', StatusCodes.BAD_REQUEST, {
              errorType: 'CONTENT_TOO_SHORT',
              field: contentField,
              actualLength,
              minRequired: minLength,
              message: '请输入有效的评论内容'
            })
          );
        }

        // 验证最大长度
        if (actualLength > maxLength) {
          logger.warn('评论长度超限', {
            userId: req.user?.id,
            actualLength,
            maxAllowed: maxLength,
            field: contentField
          });

          return res.status(StatusCodes.BAD_REQUEST).json(
            ResponseUtil.error('评论长度超限', StatusCodes.BAD_REQUEST, {
              errorType: 'CONTENT_TOO_LONG',
              field: contentField,
              actualLength,
              maxAllowed: maxLength,
              message: `评论最多允许${maxLength}个字符，当前有${actualLength}个字符`
            })
          );
        }

        // 验证通过
        req.contentLengthInfo = {
          field: contentField,
          actualLength,
          minRequired: minLength,
          maxAllowed: maxLength,
          valid: true
        };

        next();

      } catch (error) {
        logger.error('评论长度验证中间件错误:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
          ResponseUtil.error('评论验证失败', StatusCodes.INTERNAL_SERVER_ERROR, {
            errorType: 'VALIDATION_ERROR',
            message: '系统错误，请稍后再试'
          })
        );
      }
    };
  }

  /**
   * 多字段内容长度验证中间件
   * @param {Array} fieldConfigs 字段配置数组 [{field: 'title', min: 1, max: 100}, ...]
   * @returns {Function} Express中间件
   */
  static validateMultipleFields(fieldConfigs) {
    return async (req, res, next) => {
      try {
        console.log('🔍 ContentLengthMiddleware.validateMultipleFields 被调用');
        console.log('字段配置:', fieldConfigs);
        console.log('请求体:', JSON.stringify(req.body, null, 2));

        const validationResults = [];

        for (const config of fieldConfigs) {
          const { field, min = 1, max = 1000, required = true } = config;
          const content = req.body[field];

          // 检查必填字段
          if (required && (!content || typeof content !== 'string')) {
            return res.status(StatusCodes.BAD_REQUEST).json(
              ResponseUtil.error(`${field}不能为空`, StatusCodes.BAD_REQUEST, {
                errorType: 'FIELD_REQUIRED',
                field,
                message: `请输入${field}`
              })
            );
          }

          // 如果字段不是必填且为空，跳过验证
          if (!required && (!content || typeof content !== 'string')) {
            continue;
          }

          const actualLength = this.getActualLength(content);

          // 验证长度
          if (actualLength < min) {
            return res.status(StatusCodes.BAD_REQUEST).json(
              ResponseUtil.error(`${field}长度不足`, StatusCodes.BAD_REQUEST, {
                errorType: 'CONTENT_TOO_SHORT',
                field,
                actualLength,
                minRequired: min,
                message: `${field}至少需要${min}个字符，当前只有${actualLength}个字符`
              })
            );
          }

          if (actualLength > max) {
            return res.status(StatusCodes.BAD_REQUEST).json(
              ResponseUtil.error(`${field}长度超限`, StatusCodes.BAD_REQUEST, {
                errorType: 'CONTENT_TOO_LONG',
                field,
                actualLength,
                maxAllowed: max,
                message: `${field}最多允许${max}个字符，当前有${actualLength}个字符`
              })
            );
          }

          validationResults.push({
            field,
            actualLength,
            minRequired: min,
            maxAllowed: max,
            valid: true
          });
        }

        // 所有验证通过
        req.contentLengthInfo = validationResults;
        next();

      } catch (error) {
        logger.error('多字段长度验证中间件错误:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
          ResponseUtil.error('内容验证失败', StatusCodes.INTERNAL_SERVER_ERROR, {
            errorType: 'VALIDATION_ERROR',
            message: '系统错误，请稍后再试'
          })
        );
      }
    };
  }
}

module.exports = ContentLengthMiddleware;
