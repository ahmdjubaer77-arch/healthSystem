const adminPharmacyService = require('../services/admin.pharmacy.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function getPharmacies(req, res, next) {
  try {
    const result = await adminPharmacyService.getPharmacies(req.query)
    res.status(200).json({ success: true, message: 'Pharmacies retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getPharmacy(req, res, next) {
  try {
    const pharmacy = await adminPharmacyService.getPharmacyById(req.params.id)
    res.status(200).json({ success: true, message: 'Pharmacy details retrieved successfully', data: pharmacy })
  } catch (error) {
    next(error)
  }
}

async function createPharmacy(req, res, next) {
  try {
    const pharmacy = await adminPharmacyService.createPharmacy(req.body, getRequestContext(req))
    res.status(201).json({ success: true, message: 'Pharmacy created successfully', data: pharmacy })
  } catch (error) {
    next(error)
  }
}

async function updatePharmacy(req, res, next) {
  try {
    const pharmacy = await adminPharmacyService.updatePharmacy(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Pharmacy updated successfully', data: pharmacy })
  } catch (error) {
    next(error)
  }
}

async function updatePharmacyStatus(req, res, next) {
  try {
    const pharmacy = await adminPharmacyService.updatePharmacyStatus(
      req.params.id,
      req.body,
      getRequestContext(req),
    )
    res.status(200).json({ success: true, message: 'Pharmacy status updated successfully', data: pharmacy })
  } catch (error) {
    next(error)
  }
}

async function updatePharmacyVerification(req, res, next) {
  try {
    const pharmacy = await adminPharmacyService.updatePharmacyVerification(
      req.params.id,
      req.body,
      getRequestContext(req),
    )
    res.status(200).json({ success: true, message: 'Pharmacy verification updated successfully', data: pharmacy })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getPharmacies,
  getPharmacy,
  createPharmacy,
  updatePharmacy,
  updatePharmacyStatus,
  updatePharmacyVerification,
}