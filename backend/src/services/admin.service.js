const User = require('../models/User')
const BloodRequest = require('../models/BloodRequest')
const Complaint = require('../models/Complaint')
const EmergencyRequest = require('../models/EmergencyRequest')

const PROVIDER_ROLES = new Set([
  'DOCTOR',
  'PHARMACY',
  'HOSPITAL',
  'AMBULANCE_PROVIDER',
])

const countByRole = async (role) => User.countDocuments({ role })

function getActivityDateRange(now = new Date()) {
  const to = new Date(now)
  to.setUTCHours(23, 59, 59, 999)
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 6)
  from.setUTCHours(0, 0, 0, 0)
  return { from, to }
}

function getActivityDateKeys(from, to) {
  const dates = []
  for (const date = new Date(from); date <= to; date.setUTCDate(date.getUTCDate() + 1)) {
    dates.push(date.toISOString().slice(0, 10))
  }
  return dates
}

async function getDashboardActivity(now = new Date()) {
  const { from, to } = getActivityDateRange(now)
  const pipeline = [
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
  ]
  const [users, bloodRequests, emergencyRequests, complaints] = await Promise.all([
    User.aggregate(pipeline),
    BloodRequest.aggregate(pipeline),
    EmergencyRequest.aggregate(pipeline),
    Complaint.aggregate(pipeline),
  ])
  const activityByDate = new Map(
    getActivityDateKeys(from, to).map((date) => [
      date,
      { date, users: 0, bloodRequests: 0, emergencyRequests: 0, complaints: 0 },
    ]),
  )

  for (const [series, records] of [
    ['users', users],
    ['bloodRequests', bloodRequests],
    ['emergencyRequests', emergencyRequests],
    ['complaints', complaints],
  ]) {
    for (const record of records) {
      const day = activityByDate.get(record._id)
      if (day) day[series] = record.count
    }
  }

  return [...activityByDate.values()]
}

async function getDashboardSummary() {
  const [
    totalUsers,
    activeUsers,
    doctors,
    hospitals,
    pharmacies,
    ambulances,
    bloodDonors,
    complaints,
    pendingVerifications,
    recentProviderRegistrations,
    recentComplaints,
    activity,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ accountStatus: 'ACTIVE' }),
    countByRole('DOCTOR'),
    countByRole('HOSPITAL'),
    countByRole('PHARMACY'),
    countByRole('AMBULANCE_PROVIDER'),
    countByRole('BLOOD_DONOR'),
    Complaint.countDocuments(),
    User.countDocuments({ role: { $in: [...PROVIDER_ROLES] }, emailVerified: false }),
    User.find({ role: { $in: [...PROVIDER_ROLES] } })
      .select('name email role accountStatus emailVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Complaint.find()
      .select('title status reporterId createdAt')
      .populate('reporterId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    getDashboardActivity(),
  ])

  return {
    totals: {
      totalUsers,
      activeUsers,
      doctors,
      hospitals,
      pharmacies,
      ambulances,
      bloodDonors,
      activeBloodRequests: 0,
      emergencyRequests: 0,
      pendingVerifications: pendingVerifications,
      complaints,
    },
    verification: {
      pending: pendingVerifications,
      verified: 0,
      rejected: 0,
    },
    recent: {
      bloodRequests: [],
      emergencyRequests: [],
      complaints: recentComplaints.map((complaint) => ({
        id: complaint._id.toString(),
        title: complaint.title,
        status: complaint.status,
        user: complaint.reporterId?.name ? { name: complaint.reporterId.name } : null,
        createdAt: complaint.createdAt,
      })),
      providerRegistrations: recentProviderRegistrations.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })),
    },
    activity,
    source: 'database',
  }
}

module.exports = { getDashboardSummary, getDashboardActivity, getActivityDateRange, getActivityDateKeys }
