const express = require('express')
const { createAiController } = require('../controllers/ai.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')
const { createUserRateLimiter, geminiService } = require('../services/ai.service')

const router = express.Router()
const controller = createAiController({ geminiService })
const rateLimit = createUserRateLimiter()

router.post('/ai/chat', authenticate, requireRole('PATIENT'), rateLimit, controller.chat)

module.exports = router
