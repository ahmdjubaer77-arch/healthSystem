const adminService = require('../services/admin.service')

function getAdminAuthenticationStatus(req, res) {
  res.status(200).json({
    success: true,
    message: 'Admin authentication verified',
    data: {
      authenticated: true,
      role: req.user.role,
      admin: true,
      permissions: req.user.permissions,
    },
  })
}

async function getDashboardSummary(req, res, next) {
  try {
    const summary = await adminService.getDashboardSummary()
    res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: summary,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAdminAuthenticationStatus, getDashboardSummary }
