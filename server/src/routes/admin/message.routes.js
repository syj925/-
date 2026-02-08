const express = require('express');

const adminMessageController = require('../../controllers/admin/message.controller');

const router = express.Router();

router.get('/system', adminMessageController.getSystemMessages);
router.get('/system/stats', adminMessageController.getSystemMessageStats);
router.post('/system', adminMessageController.createSystemMessage);
router.get('/system/:id', adminMessageController.getSystemMessageDetail);
router.delete('/system/:id', adminMessageController.deleteSystemMessage);
router.get('/system/:id/recipients', adminMessageController.getSystemMessageRecipients);

module.exports = router;
