const adminCreationService = require('../services/admin.creation.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function createAdmin(req, res, next) {
  try {
    const user = await adminCreationService.createAdmin(req.body, getRequestContext(req))
    res.status(201).json({
      success: true,
      message: 'Administrator account created successfully',
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { createAdmin }
