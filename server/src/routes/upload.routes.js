const express = require('express');
const router = express.Router();
const { AuthMiddleware, UploadMiddleware } = require('../middlewares');
const { ResponseUtil } = require('../utils');

/**
 * 上传单张图片 (兼容根路径)
 * POST /api/upload
 */
router.post('/', AuthMiddleware.authenticate(), UploadMiddleware.single('file'), (req, res) => {
  // 文件已经上传并通过中间件处理，req.file中包含文件信息
  const fileData = {
    url: req.file.url,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  };

  res.json(ResponseUtil.success(fileData));
});

/**
 * 上传单张图片
 * POST /api/upload/image
 */
router.post('/image', AuthMiddleware.authenticate(), UploadMiddleware.single('file'), (req, res) => {
  // 文件已经上传并通过中间件处理，req.file中包含文件信息
  const fileData = {
    url: req.file.url,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  };

  res.json(ResponseUtil.success(fileData));
});

/**
 * 上传多张图片（最多9张）
 * POST /api/upload/images
 */
router.post('/images', AuthMiddleware.authenticate(), UploadMiddleware.array('files', 9), (req, res) => {
  // 文件已经上传并通过中间件处理，req.files中包含文件信息
  const filesData = req.files.map(file => ({
    url: file.url,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  }));
  
  res.json(ResponseUtil.success(filesData));
});

/**
 * 上传轮播图
 * POST /api/upload/banner
 */
router.post('/banner', AuthMiddleware.authenticate(), UploadMiddleware.single('file'), (req, res) => {
  try {
    // 验证文件类型（只允许图片）
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json(ResponseUtil.error('只能上传图片文件', 400));
    }

    // 验证文件大小（最大5MB）
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json(ResponseUtil.error('图片大小不能超过5MB', 400));
    }

    // 文件已经上传并通过中间件处理，req.file中包含文件信息
    const fileData = {
      url: req.file.url,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    };

    res.json(ResponseUtil.success(fileData, '轮播图上传成功'));
  } catch (error) {
    console.error('轮播图上传失败:', error);
    res.status(500).json(ResponseUtil.error('轮播图上传失败', 500));
  }
});

module.exports = router;