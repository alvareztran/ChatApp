const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { getMe, updateMe, updateAvatar, searchUsers, getUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const avatarUpload = require('../middleware/uploadAvatar');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

const avatarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã tải ảnh lên quá nhiều lần. Vui lòng thử lại sau.' },
});

router.use(authMiddleware);
router.get('/me', asyncHandler(getMe));
router.patch('/me', asyncHandler(updateMe));
router.post('/me/avatar', avatarLimiter, avatarUpload, asyncHandler(updateAvatar));
router.get('/search', asyncHandler(searchUsers));
router.get('/:user_id', asyncHandler(getUser));

module.exports = router;
