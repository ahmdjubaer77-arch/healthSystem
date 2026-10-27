const sharingService = require('../services/health-sharing.service')

async function lookupRecipient(req, res, next) {
  try {
    const recipient = await sharingService.lookupRecipient(req.user.userId, req.query.publicUserId)
    res.status(200).json({ success: true, message: 'Account found', data: { recipient } })
  } catch (error) {
    next(error)
  }
}

async function listShares(req, res, next) {
  try {
    const shares = await sharingService.listShares(req.user.userId)
    res.status(200).json({ success: true, message: 'Health shares retrieved', data: { shares } })
  } catch (error) {
    next(error)
  }
}

async function listReceivedShares(req, res, next) {
  try {
    const shares = await sharingService.listReceivedShares(req.user.userId)
    res.status(200).json({ success: true, message: 'Shared health information retrieved', data: { shares } })
  } catch (error) {
    next(error)
  }
}

async function createShare(req, res, next) {
  try {
    const share = await sharingService.createShare(req.user.userId, req.body)
    res.status(201).json({ success: true, message: 'Consent recorded and access granted', data: { share } })
  } catch (error) {
    next(error)
  }
}

async function revokeShare(req, res, next) {
  try {
    const share = await sharingService.revokeShare(req.user.userId, req.params.shareId)
    res.status(200).json({ success: true, message: 'Access revoked', data: { share } })
  } catch (error) {
    next(error)
  }
}

async function listAccessHistory(req, res, next) {
  try {
    const history = await sharingService.listAccessHistory(req.user.userId, req.query)
    res.status(200).json({ success: true, message: 'Health access history retrieved', data: history })
  } catch (error) {
    next(error)
  }
}

async function listSharedTimeline(req, res, next) {
  try {
    const result = await sharingService.listSharedTimeline(req.user.userId, req.params.shareId, req.query)
    res.status(200).json({ success: true, message: 'Shared timeline retrieved', data: result })
  } catch (error) {
    next(error)
  }
}

async function listSharedDocuments(req, res, next) {
  try {
    const result = await sharingService.listSharedDocuments(req.user.userId, req.params.shareId, req.query)
    res.status(200).json({ success: true, message: 'Shared documents retrieved', data: result })
  } catch (error) {
    next(error)
  }
}

async function getSharedProfile(req, res, next) {
  try {
    const profile = await sharingService.getSharedProfile(req.user.userId, req.params.shareId)
    res.status(200).json({ success: true, message: 'Shared health profile retrieved', data: { profile } })
  } catch (error) {
    next(error)
  }
}

async function getSharedDocumentContent(req, res, next) {
  try {
    const file = await sharingService.getSharedDocumentContent(
      req.user.userId,
      req.params.shareId,
      req.params.documentId,
    )
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

module.exports = {
  createShare,
  getSharedDocumentContent,
  getSharedProfile,
  listAccessHistory,
  listReceivedShares,
  lookupRecipient,
  listSharedDocuments,
  listSharedTimeline,
  listShares,
  revokeShare,
}
