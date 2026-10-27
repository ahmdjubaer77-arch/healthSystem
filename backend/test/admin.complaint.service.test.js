const { after, test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Complaint = require('../src/models/Complaint')
const User = require('../src/models/User')
const AdminAuditLog = require('../src/models/AdminAuditLog')
const complaintService = require('../src/services/admin.complaint.service')
const { ADMIN_ROLE_PERMISSIONS, SUPER_ADMIN_ROLE_PERMISSIONS } = require('../src/constants/admin.permissions')
const { getAuditLogOptions } = require('../src/services/admin.audit.service')
const { adminPermission, requireAdminPermission } = require('../src/middleware/admin.permission.middleware')

const complaints = []
const auditEntries = []
const activeAdmin = { _id: new mongoose.Types.ObjectId(), name: 'Active Admin', role: 'ADMIN', accountStatus: 'ACTIVE' }
const originalMethods = {
  complaintFind: Complaint.find,
  complaintFindById: Complaint.findById,
  complaintCount: Complaint.countDocuments,
  userFind: User.find,
  userFindOne: User.findOne,
  auditCreate: AdminAuditLog.create,
}

function createComplaint(data = {}) {
  const reporterId = new mongoose.Types.ObjectId()
  return {
    _id: new mongoose.Types.ObjectId(),
    reporterId,
    reporterName: 'Complaint Reporter',
    reporterEmail: 'private@example.com',
    title: 'Unable to access account',
    description: 'The account recovery process is not working for this reporter.',
    category: 'ACCOUNT',
    priority: 'MEDIUM',
    status: 'OPEN',
    assignedAdminId: null,
    internalNotes: [],
    resolutionInfo: '',
    rejectionReason: '',
    escalationReason: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    async save() { this.updatedAt = new Date(); return this },
    ...data,
  }
}

function regexMatches(value, condition) {
  return new RegExp(condition.$regex, condition.$options).test(value || '')
}

function matches(complaint, filter) {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$and') return condition.every((entry) => matches(complaint, entry))
    if (key === '$or') return condition.some((entry) => matches(complaint, entry))
    if (condition && condition.$regex) return regexMatches(complaint[key], condition)
    return complaint[key]?.toString() === condition?.toString()
  })
}

function populatePeople(complaint) {
  const adminId = complaint.assignedAdminId?._id || complaint.assignedAdminId
  return {
    ...complaint,
    reporterId: { _id: complaint.reporterId, name: complaint.reporterName, email: complaint.reporterEmail },
    assignedAdminId: adminId ? { _id: adminId, name: activeAdmin.name } : null,
    internalNotes: complaint.internalNotes.map((entry) => ({
      ...entry,
      authorId: { _id: entry.authorId, name: activeAdmin.name, email: 'private-admin@example.com' },
    })),
  }
}

function createQuery(complaint) {
  return {
    populate() { return this },
    lean() { return Promise.resolve(complaint ? populatePeople(complaint) : null) },
    then(resolve, reject) { return Promise.resolve(complaint).then(resolve, reject) },
  }
}

Complaint.find = (filter) => {
  let result = complaints.filter((complaint) => matches(complaint, filter))
  return {
    populate() { return this },
    sort() { return this },
    skip(count) { result = result.slice(count); return this },
    limit(count) { result = result.slice(0, count); return this },
    lean() { return Promise.resolve(result.map(populatePeople)) },
  }
}
Complaint.findById = (id) => createQuery(complaints.find((entry) => entry._id.toString() === id.toString()) || null)
Complaint.countDocuments = async (filter) => complaints.filter((complaint) => matches(complaint, filter)).length
User.findOne = () => ({ select() { return this }, then(resolve, reject) { return Promise.resolve(activeAdmin).then(resolve, reject) } })
User.find = () => ({ select() { return this }, sort() { return this }, lean() { return Promise.resolve([]) } })
AdminAuditLog.create = async (entry) => { auditEntries.push(entry); return entry }

after(() => {
  Complaint.find = originalMethods.complaintFind
  Complaint.findById = originalMethods.complaintFindById
  Complaint.countDocuments = originalMethods.complaintCount
  User.find = originalMethods.userFind
  User.findOne = originalMethods.userFindOne
  AdminAuditLog.create = originalMethods.auditCreate
})

test('complaint search, filters, privacy, assignment, notes, status, closure, escalation, and access control', async () => {
  const auditOptions = await getAuditLogOptions()
  for (const action of ['complaint.assigned', 'complaint.unassigned', 'complaint.note_added', 'complaint.status_updated', 'complaint.resolved', 'complaint.rejected', 'complaint.escalated']) {
    assert.equal(auditOptions.actions.filter((entry) => entry === action).length, 1)
  }
  for (const permission of ['complaints.read', 'complaints.manage']) {
    assert.equal(ADMIN_ROLE_PERMISSIONS.has(permission), true)
    assert.equal(SUPER_ADMIN_ROLE_PERMISSIONS.has(permission), true)
  }

  let authorizationError
  adminPermission('complaints.read')({ get: () => '' }, {}, (error) => { authorizationError = error })
  assert.equal(authorizationError.statusCode, 401)
  requireAdminPermission('complaints.manage')({ user: { role: 'PATIENT' } }, {}, (error) => { authorizationError = error })
  assert.equal(authorizationError.statusCode, 403)

  const actor = {
    userId: new mongoose.Types.ObjectId(),
    role: 'ADMIN',
    permissions: ['complaints.read', 'complaints.manage'],
    ipAddress: '127.0.0.1',
  }
  const mainComplaint = createComplaint()
  const rejectedComplaint = createComplaint({ title: 'Incorrect charge', category: 'BILLING', priority: 'HIGH' })
  const escalatedComplaint = createComplaint({ title: 'Safety issue', category: 'SAFETY', priority: 'LOW' })
  complaints.push(mainComplaint, rejectedComplaint, escalatedComplaint)

  const result = await complaintService.getComplaints({ search: 'account', priority: 'MEDIUM', status: 'OPEN', actor, page: '1', limit: '10' })
  assert.equal(result.pagination.total, 1)
  assert.equal(result.complaints[0].title, mainComplaint.title)
  assert.equal(result.complaints[0].reporter, null)
  assert.equal(result.counts.OPEN, 1)
  await assert.rejects(complaintService.getComplaints({ status: 'INVALID', actor }), { statusCode: 400 })
  await assert.rejects(complaintService.getComplaints({ unrecognized: 'filter', actor }), { statusCode: 400 })
  await assert.rejects(complaintService.getComplaints({ ...{}, actor: { permissions: [] } }), { statusCode: 403 })

  const detail = await complaintService.getComplaintById(mainComplaint._id.toString(), actor)
  assert.equal(detail.reporter.name, 'Complaint Reporter')
  assert.equal(Object.hasOwn(detail.reporter, 'email'), false)
  assert.equal(JSON.stringify(detail).includes(mainComplaint.reporterEmail), false)
  await complaintService.assignComplaint(mainComplaint._id.toString(), { adminId: activeAdmin._id.toString() }, actor)
  assert.equal(mainComplaint.assignedAdminId.toString(), activeAdmin._id.toString())
  await complaintService.addInternalNote(mainComplaint._id.toString(), { note: 'Reviewed the reported account recovery issue.' }, actor)
  assert.equal(mainComplaint.internalNotes.length, 1)
  await complaintService.updateComplaintStatus(mainComplaint._id.toString(), { status: 'IN_REVIEW' }, actor)
  assert.equal(mainComplaint.status, 'IN_REVIEW')
  await assert.rejects(complaintService.resolveComplaint(mainComplaint._id.toString(), { resolutionInfo: 'Short' }, actor), { statusCode: 400 })
  const resolved = await complaintService.resolveComplaint(mainComplaint._id.toString(), { resolutionInfo: 'Account recovery was restored and verified with the reporter.' }, actor)
  assert.equal(resolved.status, 'RESOLVED')
  assert.ok(resolved.resolvedAt)
  await assert.rejects(complaintService.addInternalNote(mainComplaint._id.toString(), { note: 'Late note' }, actor), { statusCode: 409 })

  await assert.rejects(complaintService.rejectComplaint(rejectedComplaint._id.toString(), { reason: 'No' }, actor), { statusCode: 400 })
  const rejected = await complaintService.rejectComplaint(rejectedComplaint._id.toString(), { reason: 'The submitted billing evidence does not match the transaction.' }, actor)
  assert.equal(rejected.status, 'REJECTED')
  assert.equal(rejected.rejectionReason, 'The submitted billing evidence does not match the transaction.')
  const escalated = await complaintService.escalateComplaint(escalatedComplaint._id.toString(), { reason: 'Potential safety risk requires priority review.' }, actor)
  assert.equal(escalated.priority, 'URGENT')
  assert.equal(escalated.status, 'OPEN')

  assert.deepEqual(auditEntries.map((entry) => entry.action), [
    'complaint.assigned',
    'complaint.note_added',
    'complaint.status_updated',
    'complaint.resolved',
    'complaint.rejected',
    'complaint.escalated',
  ])
})