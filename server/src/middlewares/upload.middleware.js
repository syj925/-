const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const { ResponseUtil } = require('../utils');
const errorCodes = require('../constants/error-codes');
const logger = require('../../config/logger');

/**
 * 文件上传中间件
 */
class UploadMiddleware {
  constructor() {
    // 确保上传目录存在
    if (!fs.existsSync(config.upload.dir)) {
      fs.mkdirSync(config.upload.dir, { recursive: true });
    }

    // 配置Multer存储
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        // 根据文件类型创建不同的子目录
        let uploadDir = config.upload.dir;
        if (file.mimetype.startsWith('image/')) {
          uploadDir = path.join(config.upload.dir, 'images');
        } else if (file.mimetype.startsWith('video/')) {
          uploadDir = path.join(config.upload.dir, 'videos');
        } else {
          uploadDir = path.join(config.upload.dir, 'others');
        }

        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // 生成唯一文件名，保留原始扩展名
        const extname = path.extname(file.originalname);
        const filename = `${uuidv4()}${extname}`;
        cb(null, filename);
      }
    });

    // 文件过滤器
    this.fileFilter = (req, file, cb) => {
      const allowedTypes = config.upload.allowedTypes;
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('不支持的文件类型'), false);
      }
    };

    // 创建Multer实例
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: config.upload.maxFileSize // 文件大小限制
      },
      fileFilter: this.fileFilter
    });
  }

  /**
   * 获取单文件上传中间件
   * @param {String} fieldName 表单字段名
   * @returns {Function} Express中间件
   */
  single(fieldName) {
    return (req, res, next) => {
      this.upload.single(fieldName)(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            // Multer错误处理
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json(ResponseUtil.error(errorCodes.FILE_SIZE_EXCEEDED));
            }
            return res.status(400).json(ResponseUtil.error(errorCodes.UPLOAD_FAILED, { message: err.message }));
          } else {
            // 自定义错误处理
            if (err.message === '不支持的文件类型') {
              return res.status(400).json(ResponseUtil.error(errorCodes.FILE_TYPE_NOT_ALLOWED));
            }
            return res.status(500).json(ResponseUtil.error(errorCodes.UPLOAD_FAILED, { message: err.message }));
          }
        }
        
        // 如果没有上传文件
        if (!req.file) {
          return res.status(400).json(ResponseUtil.error(errorCodes.PARAM_ERROR, { message: '未选择文件' }));
        }

        // 校验文件魔数
        try {
          const FileType = require('file-type');
          const fileType = await FileType.fromFile(req.file.path);
          
          const allowedTypes = config.upload.allowedTypes;
          // fileType 可能为 undefined (如纯文本文件)
          // 确保检测到的类型在允许列表中
          if (!fileType || !allowedTypes.includes(fileType.mime)) {
            // 删除非法文件
            fs.unlinkSync(req.file.path);
            return res.status(400).json(ResponseUtil.error(errorCodes.FILE_TYPE_NOT_ALLOWED, { message: '文件类型校验失败' }));
          }
        } catch (error) {
          logger.error('文件类型校验出错:', error);
          // 出错时默认通过，或者严格模式下拒绝? 这里选择记录日志但允许(防止依赖问题导致无法上传)，或者拒绝
          // 为了安全，应该拒绝
          if (fs.existsSync(req.file.path)) {
             fs.unlinkSync(req.file.path);
          }
          return res.status(500).json(ResponseUtil.error(errorCodes.UPLOAD_FAILED, { message: '文件校验失败' }));
        }
        
        // 添加完整的文件URL
        req.file.url = this._getFileUrl(req, req.file.path);
        
        next();
      });
    };
  }

  /**
   * 获取多文件上传中间件
   * @param {String} fieldName 表单字段名
   * @param {Number} maxCount 最大文件数
   * @returns {Function} Express中间件
   */
  array(fieldName, maxCount) {
    return (req, res, next) => {
      this.upload.array(fieldName, maxCount)(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json(ResponseUtil.error(errorCodes.FILE_SIZE_EXCEEDED));
            } else if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json(ResponseUtil.error(errorCodes.PARAM_ERROR, { message: `最多上传${maxCount}个文件` }));
            }
            return res.status(400).json(ResponseUtil.error(errorCodes.UPLOAD_FAILED, { message: err.message }));
          } else {
            if (err.message === '不支持的文件类型') {
              return res.status(400).json(ResponseUtil.error(errorCodes.FILE_TYPE_NOT_ALLOWED));
            }
            return res.status(500).json(ResponseUtil.error(errorCodes.UPLOAD_FAILED, { message: err.message }));
          }
        }
        
        // 如果没有上传文件
        if (!req.files || req.files.length === 0) {
          return res.status(400).json(ResponseUtil.error(errorCodes.PARAM_ERROR, { message: '未选择文件' }));
        }

        // 校验所有文件魔数
        try {
          const FileType = require('file-type');
          const allowedTypes = config.upload.allowedTypes;
          
          for (const file of req.files) {
            const fileType = await FileType.fromFile(file.path);
            if (!fileType || !allowedTypes.includes(fileType.mime)) {
              // 删除所有已上传文件
              req.files.forEach(f => {
                if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
              });
              return res.status(400).json(ResponseUtil.error(errorCodes.FILE_TYPE_NOT_ALLOWED, { message: '包含非法文件类型' }));
            }
          }
        } catch (error) {
          logger.error('文件类型校验出错:', error);
          req.files.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
          });
          return res.status(500).json(ResponseUtil.error(errorCodes.UPLOAD_FAILED, { message: '文件校验失败' }));
        }
        
        // 添加完整的文件URL
        req.files.forEach(file => {
          file.url = this._getFileUrl(req, file.path);
        });
        
        next();
      });
    };
  }

  /**
   * 获取多字段上传中间件
   * @param {Array} fields 字段配置数组，格式：[{name, maxCount}]
   * @returns {Function} Express中间件
   */
  fields(fields) {
    return (req, res, next) => {
      this.upload.fields(fields)(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json(ResponseUtil.error(errorCodes.FILE_SIZE_EXCEEDED));
            } else if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json(ResponseUtil.error(errorCodes.PARAM_ERROR, { message: `超出文件数量限制` }));
            }
            return res.status(400).json(ResponseUtil.error(errorCodes.UPLOAD_FAILED, { message: err.message }));
          } else {
            if (err.message === '不支持的文件类型') {
              return res.status(400).json(ResponseUtil.error(errorCodes.FILE_TYPE_NOT_ALLOWED));
            }
            return res.status(500).json(ResponseUtil.error(errorCodes.UPLOAD_FAILED, { message: err.message }));
          }
        }
        
        // 如果有文件上传，为每个文件添加URL
        if (req.files) {
          Object.values(req.files).forEach(fileArray => {
            fileArray.forEach(file => {
              file.url = this._getFileUrl(req, file.path);
            });
          });
        }
        
        next();
      });
    };
  }

  /**
   * 帖子图片上传中间件
   * @returns {Function} Express中间件
   */
  uploadPostImages() {
    return this.array('images', 9);
  }

  /**
   * 根据文件路径生成URL
   * @param {Object} req 请求对象
   * @param {String} filePath 文件路径
   * @returns {String} 文件URL
   * @private
   */
  _getFileUrl(req, filePath) {
    // 移除基础上传目录前缀，生成相对路径
    const relativePath = path.relative(config.upload.dir, filePath).replace(/\\/g, '/');

    // 根据配置决定返回相对路径还是绝对路径
    if (config.upload.urlStrategy === 'relative') {
      // 返回相对路径，由前端处理完整URL
      return `${config.server.staticPath}/${relativePath}`;
    } else {
      // 返回绝对路径（兼容旧版本）
      let baseUrl;

      // 如果配置了域名，使用配置的域名
      if (config.server.domain) {
        const protocol = config.server.useHttps ? 'https' : 'http';
        baseUrl = `${protocol}://${config.server.domain}`;
      } else {
        // 否则使用请求头的host
        baseUrl = `${req.protocol}://${req.get('host')}`;
      }

      return `${baseUrl}${config.server.staticPath}/${relativePath}`;
    }
  }
}

// 创建单例导出
const uploadMiddleware = new UploadMiddleware();
module.exports = uploadMiddleware; 