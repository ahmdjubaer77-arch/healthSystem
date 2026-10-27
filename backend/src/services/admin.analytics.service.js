const User = require('../models/User')
const Provider = require('../models/Provider')
const BloodRequest = require('../models/BloodRequest')
const EmergencyRequest = require('../models/EmergencyRequest')
const AdminAuditLog = require('../models/AdminAuditLog')
const Complaint = require('../models/Complaint')

const RANGE_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
}

const PROVIDER_TYPES = ['Doctor', 'Hospital', 'Pharmacy', 'Ambulance Provider']

function getDateRange(range) {
  const days = RANGE_DAYS[range] || RANGE_DAYS['30d']
  const to = new Date()
  const from = new Date(to)
  from.setDate(to.getDate() - days + 1)
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)

  return { from, to }
}

async function getCountDocuments(model, query = {}) {
  return model.countDocuments(query)
}

async function getAuditEventCounts(from, to) {
  const [hospitalSearches, donorConnections] = await Promise.all([
    AdminAuditLog.countDocuments({
      createdAt: { $gte: from, $lte: to },
      $or: [
        { action: { $regex: /hospital.*search/i } },
        { details: { action: { $regex: /hospital.*search/i } } },
      ],
    }),
    AdminAuditLog.countDocuments({
      createdAt: { $gte: from, $lte: to },
      $or: [
        { action: { $regex: /donor.*connect/i } },
        { details: { action: { $regex: /donor.*connect/i } } },
      ],
    }),
  ])

  return { hospitalSearches, donorConnections }
}

async function getUsersAnalytics(range) {
  const { from, to } = getDateRange(range)
  const [totalUsers, newUsers, activeUsers] = await Promise.all([
    getCountDocuments(User),
    getCountDocuments(User, { createdAt: { $gte: from, $lte: to } }),
    getCountDocuments(User, { accountStatus: 'ACTIVE' }),
  ])

  return {
    range,
    totalUsers,
    newUsers,
    activeUsers,
    newUsersInRange: newUsers,
  }
}

async function getProvidersAnalytics(range) {
  const providerQuery = {}
  const verificationStatuses = ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']
  const [doctors, hospitals, pharmacies, ambulances, verificationCounts] = await Promise.all([
    Provider.countDocuments({ ...providerQuery, providerType: 'Doctor' }),
    Provider.countDocuments({ ...providerQuery, providerType: 'Hospital' }),
    Provider.countDocuments({ ...providerQuery, providerType: 'Pharmacy' }),
    Provider.countDocuments({ ...providerQuery, providerType: 'Ambulance Provider' }),
    Promise.all(verificationStatuses.map(async (status) => [status, await Provider.countDocuments({ verificationStatus: status })])),
  ])

  return {
    range,
    doctors,
    hospitals,
    pharmacies,
    ambulances,
    verification: Object.fromEntries(verificationCounts),
  }
}

function dateFilter(from, to) {
  return { createdAt: { $gte: from, $lte: to } }
}

async function getServicesAnalytics(range) {
  const { from, to } = getDateRange(range)
  const createdInRange = dateFilter(from, to)
  const [
    bloodDonors,
    bloodRequests,
    activeBloodRequests,
    fulfilledBloodRequests,
    emergencyRequests,
    activeEmergencyRequests,
    resolvedEmergencyRequests,
    totalComplaints,
    openComplaints,
    resolvedComplaints,
    auditCounts,
  ] = await Promise.all([
    User.countDocuments({ role: 'BLOOD_DONOR' }),
    BloodRequest.countDocuments(createdInRange),
    BloodRequest.countDocuments({ ...createdInRange, status: 'ACTIVE' }),
    BloodRequest.countDocuments({ ...createdInRange, status: 'FULFILLED' }),
    EmergencyRequest.countDocuments(createdInRange),
    EmergencyRequest.countDocuments({ ...createdInRange, status: { $in: ['PENDING', 'IN_PROGRESS'] } }),
    EmergencyRequest.countDocuments({ ...createdInRange, status: 'RESOLVED' }),
    Complaint.countDocuments(createdInRange),
    Complaint.countDocuments({ ...createdInRange, status: { $in: ['OPEN', 'IN_REVIEW'] } }),
    Complaint.countDocuments({ ...createdInRange, status: 'RESOLVED' }),
    getAuditEventCounts(from, to),
  ])

  return {
    range,
    blood: { bloodDonors, bloodRequests, activeRequests: activeBloodRequests, fulfilledRequests: fulfilledBloodRequests },
    emergency: { totalRequests: emergencyRequests, activeRequests: activeEmergencyRequests, resolvedRequests: resolvedEmergencyRequests },
    complaints: { total: totalComplaints, open: openComplaints, resolved: resolvedComplaints },
    hospitalSearches: auditCounts.hospitalSearches,
    successfulDonorConnections: auditCounts.donorConnections,
  }
}

async function getOverviewAnalytics(range) {
  const [users, providers, services] = await Promise.all([
    getUsersAnalytics(range),
    getProvidersAnalytics(range),
    getServicesAnalytics(range),
  ])

  return {
    range,
    users,
    providers,
    services,
    verification: providers.verification,
  }
}

async function getAnalytics(endpoint, range) {
  if (!Object.hasOwn(RANGE_DAYS, range)) {
    const error = new Error('Invalid analytics date range')
    error.statusCode = 400
    throw error
  }
  if (endpoint === 'overview') return getOverviewAnalytics(range)
  if (endpoint === 'users') return getUsersAnalytics(range)
  if (endpoint === 'providers') return getProvidersAnalytics(range)
  if (endpoint === 'services') return getServicesAnalytics(range)
  throw new Error(`Unknown analytics endpoint: ${endpoint}`)
}

module.exports = {
  getAnalytics,
  getDateRange,
  RANGE_DAYS,
}
