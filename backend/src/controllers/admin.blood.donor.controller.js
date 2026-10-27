const donorService = require('../services/admin.blood.donor.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    permissions: req.user.permissions,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function getDonors(req, res, next) {
  try {
    const result = await donorService.getDonors(req.query)
    res.status(200).json({ success: true, message: 'Blood donors retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getDonor(req, res, next) {
  try {
    const donor = await donorService.getDonorById(req.params.id)
    res.status(200).json({ success: true, message: 'Blood donor retrieved successfully', data: donor })
  } catch (error) {
    next(error)
  }
}

async function getPatientAccounts(req, res, next) {
  try {
    const result = await donorService.getPatientAccounts(req.query, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Patient accounts retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function createDonor(req, res, next) {
  try {
    const donor = await donorService.createDonor(req.body, getRequestContext(req))
    res.status(201).json({ success: true, message: 'Blood donor added successfully', data: donor })
  } catch (error) {
    next(error)
  }
}

async function updateDonorAvailability(req, res, next) {
  try {
    const donor = await donorService.updateDonorAvailability(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Donor availability updated successfully', data: donor })
  } catch (error) {
    next(error)
  }
}

async function updateDonor(req, res, next) {
  try {
    const donor = await donorService.updateDonor(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Blood donor updated successfully', data: donor })
  } catch (error) {
    next(error)
  }
}

async function verifyDonor(req, res, next) {
  try {
    const donor = await donorService.verifyDonor(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Donor verified successfully', data: donor })
  } catch (error) {
    next(error)
  }
}

async function updateDonorStatus(req, res, next) {
  try {
    const donor = await donorService.updateDonorStatus(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Donor status updated successfully', data: donor })
  } catch (error) {
    next(error)
  }
}

module.exports = { getDonors, getDonor, getPatientAccounts, createDonor, updateDonor, updateDonorAvailability, verifyDonor, updateDonorStatus }