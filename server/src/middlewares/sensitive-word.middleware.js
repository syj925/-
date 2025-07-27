const { StatusCodes } = require('http-status-codes');
const { ResponseUtil } = require('../utils');
const logger = require('../../config/logger');

/**
 * 敏感词过滤中间件
 */
class SensitiveWordMiddleware {
  /**
   * 获取敏感词设置（动态创建）
   * @returns {Promise<Object>} 敏感词设置
   */
  static async getSensitiveWordSettings() {
    try {
      const { Setting } = require('../models');

      // 动态创建或获取敏感词过滤开关
      const [enableFilterSetting] = await Setting.findOrCreate({
        where: { key: 'enableSensitiveFilter' },
        defaults: {
          key: 'enableSensitiveFilter',
          value: 'true',
          description: '启用敏感词过滤',
          type: 'boolean',
          is_system: true
        }
      });

      // 动态创建或获取敏感词处理方式
      const [actionSetting] = await Setting.findOrCreate({
        where: { key: 'sensitiveWordAction' },
        defaults: {
          key: 'sensitiveWordAction',
          value: 'replace',
          description: '敏感词处理方式',
          type: 'string',
          is_system: true
        }
      });

      // 动态创建或获取敏感词列表
      const [wordsSetting] = await Setting.findOrCreate({
        where: { key: 'sensitiveWords' },
        defaults: {
          key: 'sensitiveWords',
          value: '赌博,色情,政治,暴力,诈骗',
          description: '敏感词列表',
          type: 'string',
          is_system: true
        }
      });

      return {
        enableSensitiveFilter: enableFilterSetting.value === 'true',
        sensitiveWordAction: actionSetting.value || 'replace',
        sensitiveWords: wordsSetting.value || ''
      };
    } catch (error) {
      logger.error('获取敏感词设置失败:', error);
      // 如果数据库操作失败，返回默认值
      return {
        enableSensitiveFilter: false,
        sensitiveWordAction: 'replace',
        sensitiveWords: ''
      };
    }
  }

  /**
   * 检测文本中的敏感词
   * @param {String} text 待检测文本
   * @param {Array} sensitiveWords 敏感词列表
   * @returns {Object} 检测结果
   */
  static detectSensitiveWords(text, sensitiveWords) {
    if (!text || !sensitiveWords || sensitiveWords.length === 0) {
      return { hasSensitiveWords: false, detectedWords: [], cleanText: text };
    }

    const detectedWords = [];
    let cleanText = text;

    // 检测敏感词（不区分大小写）
    sensitiveWords.forEach(word => {
      if (word.trim()) {
        const regex = new RegExp(word.trim(), 'gi');
        if (regex.test(text)) {
          detectedWords.push(word.trim());
          // 替换为星号
          cleanText = cleanText.replace(regex, '*'.repeat(word.trim().length));
        }
      }
    });

    return {
      hasSensitiveWords: detectedWords.length > 0,
      detectedWords,
      cleanText
    };
  }

  /**
   * 内容敏感词过滤中间件
   * @param {String} contentField 内容字段名，默认为'content'
   * @returns {Function} Express中间件
   */
  static contentFilter(contentField = 'content') {
    return async (req, res, next) => {
      try {
        // 获取敏感词设置
        const settings = await this.getSensitiveWordSettings();
        
        // 如果未启用敏感词过滤，直接通过
        if (!settings.enableSensitiveFilter) {
          return next();
        }

        // 获取要检测的内容
        const content = req.body[contentField];
        if (!content || typeof content !== 'string') {
          return next();
        }

        // 解析敏感词列表
        const sensitiveWords = settings.sensitiveWords
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);

        // 检测敏感词
        const detection = this.detectSensitiveWords(content, sensitiveWords);

        if (detection.hasSensitiveWords) {
          logger.warn('检测到敏感词', {
            userId: req.user?.id,
            content: content.substring(0, 100) + '...',
            detectedWords: detection.detectedWords,
            action: settings.sensitiveWordAction
          });

          switch (settings.sensitiveWordAction) {
            case 'replace':
              // 替换敏感词并继续
              req.body[contentField] = detection.cleanText;
              req.sensitiveWordDetection = {
                detected: true,
                action: 'replaced',
                words: detection.detectedWords
              };
              return next();

            case 'reject':
              // 直接拒绝发布
              return res.status(StatusCodes.BAD_REQUEST).json(
                ResponseUtil.error('内容包含敏感词，发布失败', StatusCodes.BAD_REQUEST, {
                  errorType: 'SENSITIVE_WORDS_DETECTED',
                  detectedWords: detection.detectedWords,
                  message: `检测到敏感词：${detection.detectedWords.join(', ')}，请修改后重试`
                })
              );

            case 'audit':
              // 标记为需要审核
              req.body.status = 'pending';
              req.sensitiveWordDetection = {
                detected: true,
                action: 'audit',
                words: detection.detectedWords
              };
              return next();

            default:
              return next();
          }
        }

        // 没有检测到敏感词，正常通过
        req.sensitiveWordDetection = {
          detected: false,
          action: 'none',
          words: []
        };
        next();

      } catch (error) {
        logger.error('敏感词过滤中间件错误:', error);
        // 发生错误时不阻止请求，但记录日志
        next();
      }
    };
  }

  /**
   * 批量内容敏感词过滤（用于多个字段）
   * @param {Array} contentFields 内容字段名数组
   * @returns {Function} Express中间件
   */
  static multiContentFilter(contentFields = ['content', 'title']) {
    return async (req, res, next) => {
      try {
        console.log('🔍 SensitiveWordMiddleware.multiContentFilter 被调用');
        console.log('检查字段:', contentFields);
        console.log('请求体:', JSON.stringify(req.body, null, 2));

        // 获取敏感词设置
        const settings = await this.getSensitiveWordSettings();
        console.log('敏感词设置:', settings);
        
        // 如果未启用敏感词过滤，直接通过
        if (!settings.enableSensitiveFilter) {
          return next();
        }

        // 解析敏感词列表
        const sensitiveWords = settings.sensitiveWords
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);

        let allDetectedWords = [];
        let hasAnyDetection = false;

        // 检测所有指定字段
        for (const field of contentFields) {
          const content = req.body[field];
          if (content && typeof content === 'string') {
            const detection = this.detectSensitiveWords(content, sensitiveWords);
            
            if (detection.hasSensitiveWords) {
              hasAnyDetection = true;
              allDetectedWords = [...new Set([...allDetectedWords, ...detection.detectedWords])];
              
              if (settings.sensitiveWordAction === 'replace') {
                req.body[field] = detection.cleanText;
              }
            }
          }
        }

        if (hasAnyDetection) {
          logger.warn('检测到敏感词', {
            userId: req.user?.id,
            fields: contentFields,
            detectedWords: allDetectedWords,
            action: settings.sensitiveWordAction
          });

          switch (settings.sensitiveWordAction) {
            case 'replace':
              req.sensitiveWordDetection = {
                detected: true,
                action: 'replaced',
                words: allDetectedWords
              };
              return next();

            case 'reject':
              return res.status(StatusCodes.BAD_REQUEST).json(
                ResponseUtil.error('内容包含敏感词，发布失败', StatusCodes.BAD_REQUEST, {
                  errorType: 'SENSITIVE_WORDS_DETECTED',
                  detectedWords: allDetectedWords,
                  message: `检测到敏感词：${allDetectedWords.join(', ')}，请修改后重试`
                })
              );

            case 'audit':
              req.body.status = 'pending';
              req.sensitiveWordDetection = {
                detected: true,
                action: 'audit',
                words: allDetectedWords
              };
              return next();

            default:
              return next();
          }
        }

        // 没有检测到敏感词
        req.sensitiveWordDetection = {
          detected: false,
          action: 'none',
          words: []
        };
        next();

      } catch (error) {
        logger.error('多字段敏感词过滤中间件错误:', error);
        next();
      }
    };
  }
}

module.exports = SensitiveWordMiddleware;
