const express = require('express');

const emojiController = require('../../controllers/emoji.controller');

const router = express.Router();

router.get('/emoji-packs', emojiController.getPacks);
router.get('/emoji-packs/:packId', emojiController.getPackById);
router.post('/emoji-packs', emojiController.createPack);
router.put('/emoji-packs/:packId', emojiController.updatePack);
router.delete('/emoji-packs/:packId', emojiController.deletePack);
router.post('/emojis', emojiController.createEmoji);
router.put('/emojis/:emojiId', emojiController.updateEmoji);
router.delete('/emojis/:emojiId', emojiController.deleteEmoji);
router.get('/emojis/pending', emojiController.getPendingEmojis);
router.post('/emojis/:customEmojiId/review', emojiController.reviewEmoji);
router.post('/emojis/sync-counts', emojiController.syncUseCounts);
router.post('/emojis/clear-cache', emojiController.clearCache);

module.exports = router;
