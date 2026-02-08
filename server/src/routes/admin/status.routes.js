const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: '管理员系统运行正常',
    data: {
      admin: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '系统健康',
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
