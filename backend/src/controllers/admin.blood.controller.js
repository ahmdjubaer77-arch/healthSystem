const adminBloodService = require('../services/admin.blood.service')

function getRequestContext(req) {
  return { userId: req.user.userId, role: req.user.role, permissions: req.user.permissions, ipAddress: req.ip || req.socket?.remoteAddress || null, userAgent: req.get('user-agent') || null }
}

async function getRequests(req, res, next) {
  try { res.status(200).json({ success: true, message: 'Blood requests retrieved successfully', data: await adminBloodService.getBloodRequests(req.query) }) } catch (error) { next(error) }
}

async function getRequest(req, res, next) {
  try { res.status(200).json({ success: true, message: 'Blood request retrieved successfully', data: await adminBloodService.getBloodRequestById(req.params.id) }) } catch (error) { next(error) }
}

async function updateStatus(req, res, next) {
  try {
    const request = await adminBloodService.updateBloodRequestStatus(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Blood request status updated successfully', data: request })
  } catch (error) { next(error) }
}

async function reportRequest(req, res, next) {
  try {
    const request = await adminBloodService.reportBloodRequest(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Blood request flagged for review successfully', data: request })
  } catch (error) { next(error) }
}

module.exports = { getRequests, getRequest, updateStatus, reportRequest }
