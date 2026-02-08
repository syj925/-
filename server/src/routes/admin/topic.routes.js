const express = require('express');

const adminTopicController = require('../../controllers/admin/topic.controller');

const router = express.Router();

router.get('/', adminTopicController.getTopicList);
router.post('/', adminTopicController.createTopic);
router.put('/:id', adminTopicController.updateTopic);
router.delete('/:id', adminTopicController.deleteTopic);
router.patch('/:id/hot', adminTopicController.setHotStatus);
router.get('/pending-images', adminTopicController.getPendingTopicImages);
router.put('/:id/review-image', adminTopicController.reviewTopicImage);

module.exports = router;
