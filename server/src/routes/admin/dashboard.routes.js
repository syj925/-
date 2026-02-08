const express = require('express');
const AdminMiddleware = require('../../middlewares/admin.middleware');
const adminDashboardController = require('../../controllers/admin/dashboard.controller');

const router = express.Router();

router.use(AdminMiddleware.authenticate());
router.use(AdminMiddleware.formatResponse());
router.use(AdminMiddleware.logOperation());

router.get('/', adminDashboardController.getDashboardData);
router.get('/trend', adminDashboardController.getTrendData);
router.get('/user-distribution', adminDashboardController.getUserDistribution);
router.post('/refresh-cache', adminDashboardController.refreshCache);
router.get('/system-status', adminDashboardController.getSystemStatus);

module.exports = router;
