const User = require('../models/User')
const Complaint = require('../models/Complaint')

const PROVIDER_ROLES = new Set([
  'DOCTOR',
  'PHARMACY',
  'HOSPITAL',
  'AMBULANCE_PROVIDER',
])

const countByRole = async (role) => User.countDocuments({ role })

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
    source: 'database',
  }
}

module.exports = { getDashboardSummary }
