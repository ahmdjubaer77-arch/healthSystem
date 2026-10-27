const complaintService = require('../services/admin.complaint.service')

function getRequestContext(req) {
  return {
    userId: req.user.userId,
    role: req.user.role,
    permissions: req.user.permissions,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  }
}

async function getComplaints(req, res, next) {
  try {
    const result = await complaintService.getComplaints({ ...req.query, actor: getRequestContext(req) })
    res.status(200).json({ success: true, message: 'Complaints retrieved successfully', data: result })
  } catch (error) {
    next(error)
  }
}

async function getComplaint(req, res, next) {
  try {
    const complaint = await complaintService.getComplaintById(req.params.id, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Complaint retrieved successfully', data: complaint })
  } catch (error) {
    next(error)
  }
}

async function assignComplaint(req, res, next) {
  try {
    const complaint = await complaintService.assignComplaint(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Complaint assignment updated', data: complaint })
  } catch (error) {
    next(error)
  }
}

async function addInternalNote(req, res, next) {
  try {
    const complaint = await complaintService.addInternalNote(req.params.id, req.body, getRequestContext(req))
    res.status(201).json({ success: true, message: 'Internal note added', data: complaint })
  } catch (error) {
    next(error)
  }
}

async function updateComplaintStatus(req, res, next) {
  try {
    const complaint = await complaintService.updateComplaintStatus(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Complaint status updated', data: complaint })
  } catch (error) {
    next(error)
  }
}

async function resolveComplaint(req, res, next) {
  try {
    const complaint = await complaintService.resolveComplaint(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Complaint resolved', data: complaint })
  } catch (error) {
    next(error)
  }
}

async function rejectComplaint(req, res, next) {
  try {
    const complaint = await complaintService.rejectComplaint(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Complaint rejected', data: complaint })
  } catch (error) {
    next(error)
  }
}

async function escalateComplaint(req, res, next) {
  try {
    const complaint = await complaintService.escalateComplaint(req.params.id, req.body, getRequestContext(req))
    res.status(200).json({ success: true, message: 'Complaint escalated', data: complaint })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getComplaints,
  getComplaint,
  assignComplaint,
  addInternalNote,
  updateComplaintStatus,
  resolveComplaint,
  rejectComplaint,
  escalateComplaint,
}