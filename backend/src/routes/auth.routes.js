const express = require('express')
const authController = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/register', authController.register)
router.post('/resend-verification', authController.resendVerification)
router.post('/forgot-password', authController.requestPasswordReset)
router.post('/verify-email', authController.verifyEmail)
router.post('/reset-password', authController.resetPassword)
router.post('/login', authController.login)
router.get('/me', authenticate, authController.me)

module.exports = router