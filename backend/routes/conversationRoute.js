const express = require('express');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const {
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
} = require('../controllers/conversationController');

const router = express.Router();

router.use(authMiddleware);
router.route('/').get(asyncHandler(getConversations)).post(asyncHandler(createConversation));
router
  .route('/:conversation_id')
  .get(asyncHandler(getConversation))
  .delete(asyncHandler(deleteConversation));

module.exports = router;
