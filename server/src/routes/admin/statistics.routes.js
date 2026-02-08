const express = require('express');

const statisticsController = require('../../controllers/admin/statistics.controller');

const router = express.Router();

router.get('/', statisticsController.getAllStats);

module.exports = router;
