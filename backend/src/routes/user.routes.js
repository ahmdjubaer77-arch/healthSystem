const express = require('express')
const userController = require('../controllers/user.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { uploadProfilePicture } = require('../middleware/profile-picture.middleware')

const router = express.Router()

router.get('/me', authenticate, userController.getMyProfile)
router.patch('/me', authenticate, userController.updateMyProfile)
router.delete('/me', authenticate, userController.deleteMyAccount)
router.post('/me/profile-picture', authenticate, uploadProfilePicture, userController.uploadProfilePicture)
router.delete('/me/profile-picture', authenticate, userController.deleteProfilePicture)

module.exports = router