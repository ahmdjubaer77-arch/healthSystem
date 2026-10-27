const adminUserService = require('../services/admin.user.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function getUsers(req, res, next) {
  try {
    const result = await adminUserService.getUsers(req.query)
    res.status(200).json({ success: true, message: 'Users retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getUser(req, res, next) {
  try {
    const user = await adminUserService.getUserById(req.params.id)
    res.status(200).json({ success: true, message: 'User details retrieved successfully', data: user })
  } catch (error) {
    next(error)
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await adminUserService.updateUserStatus(
      req.params.id,
      req.body.status,
      getRequestContext(req),
    )
    res.status(200).json({ success: true, message: `User account ${req.body.status.toLowerCase()}`, data: user })
  } catch (error) {
    next(error)
  }
}

async function updateUserRole(req, res, next) {
  try {
    const user = await adminUserService.updateUserRole(
      req.params.id,
      req.body.role,
      getRequestContext(req),
    )
    res.status(200).json({ success: true, message: 'User role updated successfully', data: user })
  } catch (error) {
    next(error)
  }
}

module.exports = { getUsers, getUser, updateUserStatus, updateUserRole }
