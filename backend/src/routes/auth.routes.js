const express = require('express')
const authController = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/email/verification/request', authController.requestEmailVerification)
router.post('/email/verification/confirm', authController.verifyEmail)
router.post('/password/reset/request', authController.requestPasswordReset)
router.post('/password/reset/verify', authController.verifyPasswordResetCode)
router.post('/password/reset/confirm', authController.resetPassword)
router.get('/me', authenticate, authController.me)

module.exports = router