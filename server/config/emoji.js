/**
 * 表情系统配置
 */
module.exports = {
  // 上传限制配置
  upload: {
    // 静态图片大小限制 (500KB)
    maxStaticSize: 500 * 1024,
    
    // GIF动图大小限制 (2MB)
    maxGifSize: 2 * 1024 * 1024,
    
    // 最大图片尺寸 (500x500)
    maxDimension: 500,
    
    // 允许的文件类型
    allowedTypes: ['image/png', 'image/gif', 'image/webp'],
    
    // 每日上传限制
    dailyLimit: 10,
    
    // 上传目录
    baseDir: 'emojis',
    
    // 子目录
    dirs: {
      packs: 'packs',     // 表情包封面
      items: 'items',     // 正式表情
      custom: 'custom'    // 用户上传待审核
    }
  },

  // 表情代码配置
  code: {
    // 代码前缀正则
    pattern: /^\[[\w\u4e00-\u9fa5_]+\]$/,
    
    // 用户自定义表情代码格式（只用表情名称，更简洁）
    userFormat: (username, name) => `[${name}]`,
    
    // 官方表情代码格式
    officialFormat: (name) => `[${name}]`
  },

  // 版本控制配置
  version: {
    // 增量更新阈值（超过此版本差距则全量更新）
    incrementalThreshold: 10
  },

  // 表情包类型
  packTypes: {
    system: '系统内置',
    official: '官方表情',
    user: '用户创建',
    store: '商店表情'
  },

  // 表情状态
  emojiStatus: {
    active: '正常',
    pending: '待审核',
    rejected: '已拒绝'
  },

  // 审核状态
  customStatus: {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  },

  // 文件头签名（用于验证文件类型）
  fileSignatures: {
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46]
  },

  /**
   * 验证文件类型
   * @param {Buffer} buffer 文件缓冲区
   * @param {string} expectedType 期望的MIME类型
   * @returns {boolean}
   */
  validateFileType(buffer, expectedType) {
    const signature = this.fileSignatures[expectedType];
    if (!signature) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }
    return true;
  },

  /**
   * 获取文件类型限制大小
   * @param {string} mimeType MIME类型
   * @returns {number} 最大大小（字节）
   */
  getMaxSize(mimeType) {
    if (mimeType === 'image/gif') {
      return this.upload.maxGifSize;
    }
    return this.upload.maxStaticSize;
  }
};
