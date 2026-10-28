const express = require('express')
const userController = require('../controllers/user.controller')
const feedbackController = require('../controllers/feedback.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { uploadProfilePicture } = require('../middleware/profile-picture.middleware')

const router = express.Router()

router.post('/feedback', authenticate, feedbackController.submitFeedback)
router.get('/me', authenticate, userController.getMyProfile)
router.patch('/me', authenticate, userController.updateMyProfile)
router.post('/me/change-password', authenticate, userController.changeMyPassword)
router.post('/me/email-change/request', authenticate, userController.requestEmailChange)
router.post('/me/email-change/confirm', authenticate, userController.confirmEmailChange)
router.delete('/me', authenticate, userController.deleteMyAccount)
router.post('/me/profile-picture', authenticate, uploadProfilePicture, userController.uploadProfilePicture)
router.delete('/me/profile-picture', authenticate, userController.deleteProfilePicture)

module.exports = router