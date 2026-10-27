const healthService = require('../services/health.service')

async function getHealthProfile(req, res, next) {
  try {
    const healthProfile = await healthService.getHealthProfile(req.user.userId)
    res.status(200).json({
      success: true,
      message: 'Health profile retrieved successfully',
      data: { healthProfile },
    })
  } catch (error) {
    next(error)
  }
}

async function createHealthProfile(req, res, next) {
  try {
    const healthProfile = await healthService.createHealthProfile(req.user.userId, req.body)
    res.status(201).json({
      success: true,
      message: 'Health profile created successfully',
      data: { healthProfile },
    })
  } catch (error) {
    next(error)
  }
}

async function updateHealthProfile(req, res, next) {
  try {
    const healthProfile = await healthService.updateHealthProfile(req.user.userId, req.body)
    res.status(200).json({
      success: true,
      message: 'Health profile updated successfully',
      data: { healthProfile },
    })
  } catch (error) {
    next(error)
  }
}

async function getTimeline(req, res, next) {
  try {
    const result = await healthService.getTimeline(req.user.userId, req.query)
    res.status(200).json({
      success: true,
      message: 'Medical timeline retrieved successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function createTimelineEntry(req, res, next) {
  try {
    const timelineEntry = await healthService.createTimelineEntry(req.user.userId, req.body)
    res.status(201).json({
      success: true,
      message: 'Medical timeline entry created successfully',
      data: { timelineEntry },
    })
  } catch (error) {
    next(error)
  }
}

async function updateTimelineEntry(req, res, next) {
  try {
    const timelineEntry = await healthService.updateTimelineEntry(req.user.userId, req.params.id, req.body)
    res.status(200).json({
      success: true,
      message: 'Medical timeline entry updated successfully',
      data: { timelineEntry },
    })
  } catch (error) {
    next(error)
  }
}

async function deleteTimelineEntry(req, res, next) {
  try {
    const result = await healthService.deleteTimelineEntry(req.user.userId, req.params.id)
    res.status(200).json({
      success: true,
      message: 'Medical timeline entry deleted successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function uploadMedicalDocument(req, res, next) {
  try {
    const document = await healthService.uploadMedicalDocument(req.user.userId, req.file, req.body)
    res.status(201).json({
      success: true,
      message: 'Medical document uploaded successfully',
      data: { document },
    })
  } catch (error) {
    next(error)
  }
}

async function getMedicalDocuments(req, res, next) {
  try {
    const documents = await healthService.getMedicalDocuments(req.user.userId)
    res.status(200).json({
      success: true,
      message: 'Medical documents retrieved successfully',
      data: { documents },
    })
  } catch (error) {
    next(error)
  }
}

async function getMedicalDocumentContent(req, res, next) {
  try {
    const file = await healthService.getMedicalDocumentContent(req.user.userId, req.params.id)
    const safeFileName = encodeURIComponent(file.fileName)
    res.set({
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="medical-report"; filename*=UTF-8''${safeFileName}`,
      'Content-Type': file.contentType,
      'X-Content-Type-Options': 'nosniff',
    })
    res.status(200).send(file.buffer)
  } catch (error) {
    next(error)
  }
}

async function deleteMedicalDocument(req, res, next) {
  try {
    const result = await healthService.deleteMedicalDocument(req.user.userId, req.params.id)
    res.status(200).json({
      success: true,
      message: 'Medical document deleted successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getHealthProfile,
  createHealthProfile,
  updateHealthProfile,
  getTimeline,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  uploadMedicalDocument,
  getMedicalDocuments,
  getMedicalDocumentContent,
  deleteMedicalDocument,
}