const adminHospitalService = require('../services/admin.hospital.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function getHospitals(req, res, next) {
  try {
    const result = await adminHospitalService.getHospitals(req.query)
    res.status(200).json({ success: true, message: 'Hospitals retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getHospital(req, res, next) {
  try {
    const hospital = await adminHospitalService.getHospitalById(req.params.id)
    res.status(200).json({ success: true, message: 'Hospital details retrieved successfully', data: hospital })
  } catch (error) {
    next(error)
  }
}

async function createHospital(req, res, next) {
  try {
    const hospital = await adminHospitalService.createHospital(req.body, getRequestContext(req))
    res.status(201).json({ success: true, message: 'Hospital created successfully', data: hospital })
  } catch (error) {
    next(error)
  }
}

async function updateHospital(req, res, next) {
  try {
    const hospital = await adminHospitalService.updateHospital(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Hospital updated successfully', data: hospital })
  } catch (error) {
    next(error)
  }
}

async function updateHospitalStatus(req, res, next) {
  try {
    const hospital = await adminHospitalService.updateHospitalStatus(
      req.params.id,
      req.body.status,
      getRequestContext(req),
    )
    res.status(200).json({ success: true, message: 'Hospital status updated successfully', data: hospital })
  } catch (error) {
    next(error)
  }
}

async function updateHospitalVerification(req, res, next) {
  try {
    const hospital = await adminHospitalService.updateHospitalVerification(
      req.params.id,
      req.body.status,
      req.body.reason,
      getRequestContext(req),
    )
    res.status(200).json({ success: true, message: 'Hospital verification updated successfully', data: hospital })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  updateHospitalStatus,
  updateHospitalVerification,
}
