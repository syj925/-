const express = require('express');
const adminRecommendationController = require('../../controllers/admin/recommendation.controller');

const router = express.Router();

router.get('/settings', (req, res, next) => adminRecommendationController.getRecommendationSettings(req, res, next));
router.put('/settings', (req, res, next) => adminRecommendationController.updateRecommendationSettings(req, res, next));
router.post('/init', (req, res, next) => adminRecommendationController.initializeRecommendationSettings(req, res, next));
router.delete('/cache', (req, res, next) => adminRecommendationController.clearRecommendationCache(req, res, next));
router.get('/stats', (req, res, next) => adminRecommendationController.getRecommendationStats(req, res, next));
router.get('/test', (req, res, next) => adminRecommendationController.testRecommendationAlgorithm(req, res, next));
router.post('/recalculate', (req, res, next) => adminRecommendationController.triggerScoreRecalculation(req, res, next));
router.post('/analyze', (req, res, next) => adminRecommendationController.analyzePostScore(req, res, next));
router.post('/auto-update/start', (req, res, next) => adminRecommendationController.startAutoUpdate(req, res, next));
router.post('/auto-update/stop', (req, res, next) => adminRecommendationController.stopAutoUpdate(req, res, next));
router.get('/auto-update/status', (req, res, next) => adminRecommendationController.getAutoUpdateStatus(req, res, next));
router.get('/presets', (req, res, next) => adminRecommendationController.getPresetConfigurations(req, res, next));
router.post('/presets/apply', (req, res, next) => adminRecommendationController.applyPresetConfiguration(req, res, next));
router.get('/export', (req, res, next) => adminRecommendationController.exportCurrentConfiguration(req, res, next));
router.post('/import', (req, res, next) => adminRecommendationController.importCustomConfiguration(req, res, next));

module.exports = router;
