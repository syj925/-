/**
 * 内容验证工具类
 * 负责前端内容验证，减少无效请求
 * 使用本地配置 + 远程更新的混合方案
 */
import { http } from '@/api/request'
import {
  defaultValidationRules,
  rulesVersion,
  remoteConfigUrl,
  cacheConfig,
  errorMessages
} from '@/config/validation-rules'

class ContentValidator {
  constructor() {
    this.rules = defaultValidationRules // 使用本地默认规则
    this.lastUpdateTime = 0
    this.cacheExpireTime = cacheConfig.expireTime
    this.isInitialized = false

    // 监听配置更新事件
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听配置更新事件
    uni.$on('configUpdated', (updateInfo) => {
      console.log('📢 收到配置更新通知:', updateInfo)
      this.handleConfigUpdate()
    })

    // 监听验证规则更新事件
    uni.$on('validationRulesUpdated', () => {
      console.log('📢 验证规则已更新，重新初始化...')
      this.isInitialized = false
      this.init()
    })
  }

  /**
   * 初始化验证规则
   * @returns {Promise<Object>} 验证规则
   */
  async init() {
    if (this.isInitialized) {
      return this.rules
    }

    // 1. 首先使用本地默认规则（确保离线可用）
    this.rules = { ...defaultValidationRules }
    console.log('📋 使用本地默认验证规则')

    // 2. 尝试从本地缓存读取更新的规则
    try {
      const cached = uni.getStorageSync(cacheConfig.storageKey)
      if (cached && cached.rules && cached.timestamp) {
        const now = Date.now()
        if ((now - cached.timestamp) < this.cacheExpireTime) {
          this.rules = { ...this.rules, ...cached.rules }
          this.lastUpdateTime = cached.timestamp
          console.log('💾 使用本地缓存的验证规则')
        }
      }
    } catch (error) {
      console.warn('读取本地缓存失败:', error)
    }

    // 3. 尝试从远程获取最新规则（可选，失败不影响使用）
    this.updateRulesFromRemote()

    this.isInitialized = true
    return this.rules
  }

  /**
   * 从远程更新规则（异步，不阻塞主流程）
   */
  async updateRulesFromRemote() {
    try {
      console.log('🔄 尝试从远程更新验证规则...')
      const response = await http.get(remoteConfigUrl)

      if (response.code === 0 && response.data) {
        // 合并远程规则和本地默认规则
        const updatedRules = { ...defaultValidationRules, ...response.data }
        this.rules = updatedRules
        this.lastUpdateTime = Date.now()

        // 保存到本地缓存
        uni.setStorageSync(cacheConfig.storageKey, {
          rules: response.data, // 只缓存远程的差异部分
          timestamp: this.lastUpdateTime,
          version: response.data.version || rulesVersion
        })

        console.log('✅ 验证规则远程更新成功')
      }
    } catch (error) {
      console.warn('⚠️ 远程更新验证规则失败，继续使用本地规则:', error.message)
      // 不抛出错误，确保不影响主流程
    }
  }

  /**
   * 获取验证规则
   * @returns {Promise<Object>} 验证规则
   */
  async getRules() {
    if (!this.isInitialized) {
      await this.init()
    }
    return this.rules
  }

  /**
   * 验证帖子内容
   * @param {String} content 帖子内容
   * @param {String} title 帖子标题（可选）
   * @returns {Promise<Object>} 验证结果
   */
  async validatePost(content, title = '') {
    const rules = await this.getRules()
    const errors = []

    // 1. 验证内容长度
    if (!content || typeof content !== 'string') {
      errors.push({
        type: 'CONTENT_REQUIRED',
        message: '请输入帖子内容',
        field: 'content'
      })
    } else {
      const actualLength = content.trim().length
      
      if (actualLength < rules.minPostLength) {
        errors.push({
          type: 'CONTENT_TOO_SHORT',
          message: errorMessages.CONTENT_TOO_SHORT.replace('{min}', rules.minPostLength),
          field: 'content',
          actualLength,
          minRequired: rules.minPostLength
        })
      }

      if (actualLength > rules.maxPostLength) {
        errors.push({
          type: 'CONTENT_TOO_LONG',
          message: errorMessages.CONTENT_TOO_LONG.replace('{max}', rules.maxPostLength),
          field: 'content',
          actualLength,
          maxAllowed: rules.maxPostLength
        })
      }
    }

    // 2. 验证标题长度（如果有标题）
    if (title && typeof title === 'string') {
      const titleLength = title.trim().length
      if (titleLength > 200) {
        errors.push({
          type: 'TITLE_TOO_LONG',
          message: `标题最多允许200个字符，当前有${titleLength}个字符`,
          field: 'title',
          actualLength: titleLength,
          maxAllowed: 200
        })
      }
    }

    // 3. 验证敏感词
    if (rules.enableSensitiveFilter && rules.sensitiveWords.length > 0) {
      const sensitiveCheck = this.checkSensitiveWords(content, rules.sensitiveWords)
      if (sensitiveCheck.hasSensitiveWords) {
        errors.push({
          type: 'SENSITIVE_WORDS_DETECTED',
          message: `内容包含敏感词：${sensitiveCheck.detectedWords.join(', ')}，请修改后重试`,
          field: 'content',
          detectedWords: sensitiveCheck.detectedWords,
          action: rules.sensitiveWordAction
        })
      }

      // 如果有标题，也检查标题的敏感词
      if (title) {
        const titleSensitiveCheck = this.checkSensitiveWords(title, rules.sensitiveWords)
        if (titleSensitiveCheck.hasSensitiveWords) {
          errors.push({
            type: 'SENSITIVE_WORDS_DETECTED',
            message: `标题包含敏感词：${titleSensitiveCheck.detectedWords.join(', ')}，请修改后重试`,
            field: 'title',
            detectedWords: titleSensitiveCheck.detectedWords,
            action: rules.sensitiveWordAction
          })
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      rules
    }
  }

  /**
   * 验证评论内容
   * @param {String} content 评论内容
   * @returns {Promise<Object>} 验证结果
   */
  async validateComment(content) {
    const rules = await this.getRules()
    const errors = []

    // 评论长度限制相对宽松
    const minLength = 1
    const maxLength = 500

    if (!content || typeof content !== 'string') {
      errors.push({
        type: 'CONTENT_REQUIRED',
        message: '请输入评论内容',
        field: 'content'
      })
    } else {
      const actualLength = content.trim().length
      
      if (actualLength < minLength) {
        errors.push({
          type: 'CONTENT_TOO_SHORT',
          message: '请输入有效的评论内容',
          field: 'content'
        })
      }
      
      if (actualLength > maxLength) {
        errors.push({
          type: 'CONTENT_TOO_LONG',
          message: `评论最多允许${maxLength}个字符，当前有${actualLength}个字符`,
          field: 'content',
          actualLength,
          maxAllowed: maxLength
        })
      }
    }

    // 验证敏感词
    if (rules.enableSensitiveFilter && rules.sensitiveWords.length > 0) {
      const sensitiveCheck = this.checkSensitiveWords(content, rules.sensitiveWords)
      if (sensitiveCheck.hasSensitiveWords) {
        errors.push({
          type: 'SENSITIVE_WORDS_DETECTED',
          message: `评论包含敏感词：${sensitiveCheck.detectedWords.join(', ')}，请修改后重试`,
          field: 'content',
          detectedWords: sensitiveCheck.detectedWords,
          action: rules.sensitiveWordAction
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      rules
    }
  }

  /**
   * 检测敏感词
   * @param {String} text 待检测文本
   * @param {Array} sensitiveWords 敏感词列表
   * @returns {Object} 检测结果
   */
  checkSensitiveWords(text, sensitiveWords) {
    if (!text || !sensitiveWords || sensitiveWords.length === 0) {
      return { hasSensitiveWords: false, detectedWords: [] }
    }

    const detectedWords = []

    sensitiveWords.forEach(word => {
      if (word && word.trim()) {
        const regex = new RegExp(word.trim(), 'gi')
        if (regex.test(text)) {
          detectedWords.push(word.trim())
        }
      }
    })

    return {
      hasSensitiveWords: detectedWords.length > 0,
      detectedWords: [...new Set(detectedWords)] // 去重
    }
  }

  /**
   * 处理配置更新
   */
  async handleConfigUpdate() {
    try {
      // 重新初始化验证规则
      this.isInitialized = false
      await this.init()
      console.log('✅ 验证规则已更新')
    } catch (error) {
      console.error('处理配置更新失败:', error)
    }
  }

  /**
   * 强制刷新验证规则
   * @returns {Promise<Object>} 最新规则
   */
  async refreshRules() {
    this.isInitialized = false
    return await this.init()
  }

  /**
   * 显示验证错误
   * @param {Array} errors 错误列表
   */
  showValidationErrors(errors) {
    if (!errors || errors.length === 0) return

    const error = errors[0] // 显示第一个错误

    switch (error.type) {
      case 'SENSITIVE_WORDS_DETECTED':
        uni.showModal({
          title: '内容包含敏感词',
          content: error.message,
          showCancel: false,
          confirmText: '我知道了'
        })
        break
      
      default:
        uni.showToast({
          title: error.message,
          icon: 'none',
          duration: 3000
        })
        break
    }
  }
}

// 创建单例
const contentValidator = new ContentValidator()

export default contentValidator
