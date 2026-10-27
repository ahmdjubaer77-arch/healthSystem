const adminDoctorService = require('../services/admin.doctor.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    permissions: req.user.permissions,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function getDoctors(req, res, next) {
  try {
    const result = await adminDoctorService.getDoctors(req.query)
    res.status(200).json({ success: true, message: 'Doctors retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getDoctor(req, res, next) {
  try {
    const doctor = await adminDoctorService.getDoctorById(req.params.id)
    res.status(200).json({ success: true, message: 'Doctor profile retrieved successfully', data: doctor })
  } catch (error) {
    next(error)
  }
}

async function getPublicDoctors(req, res, next) {
  try {
    const result = await adminDoctorService.getPublicDoctors(req.query)
    res.status(200).json({ success: true, message: 'Doctors retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getPublicDoctor(req, res, next) {
  try {
    const doctor = await adminDoctorService.getPublicDoctorById(req.params.id)
    res.status(200).json({ success: true, message: 'Doctor profile retrieved successfully', data: { doctor } })
  } catch (error) {
    next(error)
  }
}

async function createDoctor(req, res, next) {
  try {
    const doctor = await adminDoctorService.createDoctor(req.body, getRequestContext(req))
    res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor })
  } catch (error) {
    next(error)
  }
}

async function updateDoctor(req, res, next) {
  try {
    const doctor = await adminDoctorService.updateDoctor(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Doctor profile updated successfully', data: doctor })
  } catch (error) {
    next(error)
  }
}

async function getDoctorCredential(req, res, next) {
  try {
    const credential = await adminDoctorService.getDoctorCredentialUrl(
      req.params.id,
      req.params.credentialId,
      getRequestContext(req),
    )
    res.status(200).json({ success: true, message: 'Doctor credential link created', data: credential })
  } catch (error) {
    next(error)
  }
}

async function updateDoctorVerification(req, res, next) {
  try {
    const doctor = await adminDoctorService.updateDoctorVerification(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Doctor verification updated successfully', data: doctor })
  } catch (error) {
    next(error)
  }
}

async function updateDoctorStatus(req, res, next) {
  try {
    const doctor = await adminDoctorService.updateDoctorStatus(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Doctor status updated successfully', data: doctor })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getDoctors,
  getDoctor,
  getPublicDoctors,
  getPublicDoctor,
  createDoctor,
  updateDoctor,
  getDoctorCredential,
  updateDoctorVerification,
  updateDoctorStatus,
}