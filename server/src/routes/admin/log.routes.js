const express = require('express');

const adminLogController = require('../../controllers/admin/log.controller');

const router = express.Router();

router.get('/', adminLogController.getLogs);

module.exports = router;
