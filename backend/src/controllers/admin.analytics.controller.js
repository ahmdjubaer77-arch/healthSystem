const analyticsService = require('../services/admin.analytics.service')

async function getAnalytics(req, res, next) {
  try {
    const range = req.query.range || '30d'
    const data = await analyticsService.getAnalytics(req.params.endpoint, range)

    res.status(200).json({
      success: true,
      message: 'Admin analytics retrieved successfully',
      data,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAnalytics }
