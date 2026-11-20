const express = require('express');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');
const { getFriends, deleteFriend } = require('../controllers/friendController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', asyncHandler(getFriends));
router.delete('/:friend_id', asyncHandler(deleteFriend));

module.exports = router;
