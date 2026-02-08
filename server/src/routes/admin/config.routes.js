const express = require('express');

const configController = require('../../controllers/config.controller');

const router = express.Router();

router.get('/config-version', configController.getAdminConfigVersion);
router.get('/config-versions', configController.getVersionHistory);
router.post('/config-version', configController.publishConfigVersion);
router.post('/config-rollback', configController.rollbackToVersion);

module.exports = router;
