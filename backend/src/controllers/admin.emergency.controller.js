const adminEmergencyService = require('../services/admin.emergency.service')

function getRequestContext(req) {
  return { userId: req.user.userId, role: req.user.role, permissions: req.user.permissions, ipAddress: req.ip || req.socket?.remoteAddress || null, userAgent: req.get('user-agent') || null }
}

async function getRequests(req, res, next) {
  try { res.status(200).json({ success: true, message: 'Emergency requests retrieved successfully', data: await adminEmergencyService.getEmergencyRequests(req.query) }) } catch (error) { next(error) }
}

async function getRequest(req, res, next) {
  try { res.status(200).json({ success: true, message: 'Emergency request retrieved successfully', data: await adminEmergencyService.getEmergencyRequestById(req.params.id) }) } catch (error) { next(error) }
}

async function updateStatus(req, res, next) {
  try {
    const request = await adminEmergencyService.updateEmergencyRequestStatus(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Emergency request status updated successfully', data: request })
  } catch (error) { next(error) }
}

module.exports = { getRequests, getRequest, updateStatus }
