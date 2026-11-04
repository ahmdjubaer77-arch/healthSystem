const bloodRequestService = require('../services/blood.request.service')

async function listPublic(req, res, next) {
  try {
    const result = await bloodRequestService.getPublicBloodRequests(req.query)
    res.status(200).json({ success: true, message: 'Verified blood requests retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getPublic(req, res, next) {
  try {
    const request = await bloodRequestService.getPublicBloodRequestById(req.params.id)
    res.status(200).json({ success: true, message: 'Blood request retrieved successfully', data: request })
  } catch (error) {
    next(error)
  }
}

async function create(req, res, next) {
  try {
    const request = await bloodRequestService.createBloodRequest(req.user.userId, req.body)
    res.status(201).json({ success: true, message: 'Blood request submitted for verification', data: request })
  } catch (error) {
    next(error)
  }
}

async function listMine(req, res, next) {
  try {
    const result = await bloodRequestService.getMyBloodRequests(req.user.userId)
    res.status(200).json({ success: true, message: 'Your blood requests retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function report(req, res, next) {
  try {
    const result = await bloodRequestService.reportPublicBloodRequest(
      req.params.id,
      req.user.userId,
      req.body,
    )
    res.status(201).json({ success: true, message: 'Blood request reported for review', data: result })
  } catch (error) {
    next(error)
  }
}

module.exports = { listPublic, getPublic, create, listMine, report }
