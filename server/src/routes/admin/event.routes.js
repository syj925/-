const express = require('express');

const adminEventController = require('../../controllers/admin/event.controller');

const router = express.Router();

router.get('/', adminEventController.getEventList);
router.get('/statistics', adminEventController.getGlobalEventStatistics);
router.get('/:id', adminEventController.getEventDetail);
router.post('/', adminEventController.createEvent);
router.put('/:id', adminEventController.updateEvent);
router.delete('/:id', adminEventController.deleteEvent);
router.get('/:id/registrations', adminEventController.getEventRegistrations);
router.put('/:eventId/registrations/:registrationId/status', adminEventController.updateRegistrationStatus);
router.put('/:eventId/registrations/batch-status', adminEventController.batchUpdateRegistrationStatus);
router.get('/:id/statistics', adminEventController.getEventStatistics);
router.get('/:id/registrations/export', adminEventController.exportEventRegistrations);

module.exports = router;
