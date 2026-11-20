const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { signup, signin, signout, refreshToken } = require('../controllers/authController');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.' },
});

router.post('/signup', credentialsLimiter, asyncHandler(signup));
router.post('/signin', credentialsLimiter, asyncHandler(signin));
router.post('/signout', asyncHandler(signout));
router.post('/refresh', asyncHandler(refreshToken));

module.exports = router;
