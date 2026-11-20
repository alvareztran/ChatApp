const express = require('express');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const {
  sendFriendRequest,
  getReceivedRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} = require('../controllers/friendRequestController');

const router = express.Router();

router.use(authMiddleware);
router.get('/received', asyncHandler(getReceivedRequests));
router.post('/', asyncHandler(sendFriendRequest));
router.patch('/:requestId/accept', asyncHandler(acceptFriendRequest));
router.patch('/:requestId/reject', asyncHandler(rejectFriendRequest));

module.exports = router;
