const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  googleAuth,
  verifyCode,
  resendCode
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/verify-code', verifyCode);
router.post('/resend-code', resendCode);
router.post('/google/verify', verifyCode);
router.post('/google/resend', resendCode);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
