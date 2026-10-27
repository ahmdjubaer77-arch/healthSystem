const adminAuditService = require('../services/admin.audit.service')

async function getAuditLogs(req, res, next) {
  try {
    const data = await adminAuditService.getAuditLogs(req.query)
    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data,
      options: await adminAuditService.getAuditLogOptions(),
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAuditLogs }
