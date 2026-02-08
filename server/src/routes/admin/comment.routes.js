const express = require('express');

const adminCommentController = require('../../controllers/admin/comment.controller');

const router = express.Router();

router.get('/pending', adminCommentController.getPendingComments);
router.get('/', adminCommentController.getCommentList);
router.get('/:id', adminCommentController.getCommentDetail);
router.put('/:id', adminCommentController.updateComment);
router.delete('/:id', adminCommentController.deleteComment);
router.put('/:id/audit', adminCommentController.auditComment);

module.exports = router;
