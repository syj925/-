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

module.exports = router; 