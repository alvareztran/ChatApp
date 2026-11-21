const express = require('express');
const authMiddleware = require('../middleware/auth');
const uploadMessageImage = require('../middleware/uploadMessageImage');
const { asyncHandler } = require('../utils/helpers');
const { getMessages, sendMessage, deleteMessage } = require('../controllers/messageController');

const router = express.Router();

router.use(authMiddleware);
router.post('/', uploadMessageImage, asyncHandler(sendMessage));
router.get('/conversation/:conversation_id', asyncHandler(getMessages));
router.delete('/:message_id', asyncHandler(deleteMessage));

module.exports = router;
