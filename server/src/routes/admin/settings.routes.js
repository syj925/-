const express = require('express');

const adminSettingsController = require('../../controllers/admin/settings.controller');

const router = express.Router();

router.get('/', adminSettingsController.getSettings);
router.put('/', adminSettingsController.updateSettings);
router.post('/init-recommendation', adminSettingsController.initRecommendSettings);
router.post('/init-search', adminSettingsController.initSearchSettings);

module.exports = router;
