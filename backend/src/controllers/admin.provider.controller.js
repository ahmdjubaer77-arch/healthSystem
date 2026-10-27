const adminProviderService = require('../services/admin.provider.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    permissions: req.user.permissions,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function getProviders(req, res, next) {
  try {
    const result = await adminProviderService.getProviders(req.query)
    res.status(200).json({ success: true, message: 'Providers retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getProvider(req, res, next) {
  try {
    const provider = await adminProviderService.getProviderById(req.params.id)
    res.status(200).json({ success: true, message: 'Provider details retrieved successfully', data: provider })
  } catch (error) {
    next(error)
  }
}

async function updateProviderStatus(req, res, next) {
  try {
    const { status, reason } = req.body
    if (status === 'REJECTED' && !String(reason || '').trim()) {
      return res.status(400).json({ success: false, message: 'A rejection reason is required.' })
    }

    const provider = await adminProviderService.updateProviderStatus(
      req.params.id,
      status,
      reason,
      getRequestContext(req),
    )
    res.status(200).json({ success: true, message: 'Provider status updated successfully', data: provider })
  } catch (error) {
    next(error)
  }
}

module.exports = { getProviders, getProvider, updateProviderStatus }
