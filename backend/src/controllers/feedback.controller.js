const feedbackService = require('../services/feedback.service')

async function submitFeedback(req, res, next) {
  try {
    await feedbackService.sendFeedback({
      userId: req.user.userId,
      category: req.body?.category,
      message: req.body?.message,
    })
    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully',
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { submitFeedback }
