const express = require('express');
const { getMe, updateMe, searchUsers, getUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

router.use(authMiddleware);
router.get('/me', asyncHandler(getMe));
router.patch('/me', asyncHandler(updateMe));
router.get('/search', asyncHandler(searchUsers));
router.get('/:user_id', asyncHandler(getUser));

module.exports = router;
