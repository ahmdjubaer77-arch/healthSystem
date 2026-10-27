const adminAmbulanceService = require('../services/admin.ambulance.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    permissions: req.user.permissions,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function getAmbulances(req, res, next) {
  try {
    const result = await adminAmbulanceService.getAmbulances(req.query)
    res.status(200).json({ success: true, message: 'Ambulance providers retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getAmbulance(req, res, next) {
  try {
    const provider = await adminAmbulanceService.getAmbulanceById(req.params.id)
    res.status(200).json({ success: true, message: 'Ambulance provider retrieved successfully', data: provider })
  } catch (error) {
    next(error)
  }
}

async function getPublicAmbulances(req, res, next) {
  try {
    const result = await adminAmbulanceService.getPublicAmbulances(req.query)
    res.status(200).json({ success: true, message: 'Ambulances retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getPublicAmbulance(req, res, next) {
  try {
    const provider = await adminAmbulanceService.getPublicAmbulanceById(req.params.id)
    res.status(200).json({ success: true, message: 'Ambulance provider retrieved successfully', data: { ambulance: provider } })
  } catch (error) {
    next(error)
  }
}

async function createAmbulance(req, res, next) {
  try {
    const provider = await adminAmbulanceService.createAmbulance(req.body, getRequestContext(req))
    res.status(201).json({ success: true, message: 'Ambulance provider created successfully', data: provider })
  } catch (error) {
    next(error)
  }
}

async function updateAmbulance(req, res, next) {
  try {
    const provider = await adminAmbulanceService.updateAmbulance(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Ambulance provider updated successfully', data: provider })
  } catch (error) {
    next(error)
  }
}

async function updateAmbulanceVerification(req, res, next) {
  try {
    const provider = await adminAmbulanceService.updateAmbulanceVerification(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Ambulance verification updated successfully', data: provider })
  } catch (error) {
    next(error)
  }
}

async function updateAmbulanceStatus(req, res, next) {
  try {
    const provider = await adminAmbulanceService.updateAmbulanceStatus(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Ambulance provider status updated successfully', data: provider })
  } catch (error) {
    next(error)
  }
}

async function updateAmbulanceOperationalStatus(req, res, next) {
  try {
    const provider = await adminAmbulanceService.updateAmbulanceOperationalStatus(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Operational status updated successfully', data: provider })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAmbulances,
  getAmbulance,
  getPublicAmbulances,
  getPublicAmbulance,
  createAmbulance,
  updateAmbulance,
  updateAmbulanceVerification,
  updateAmbulanceStatus,
  updateAmbulanceOperationalStatus,
}