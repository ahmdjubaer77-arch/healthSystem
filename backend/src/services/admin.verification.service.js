const Provider = require('../models/Provider')

async function getVerificationSummary() {
  const [pending, underReview, verified, rejected, suspended] = await Promise.all([
    Provider.countDocuments({ verificationStatus: 'PENDING' }),
    Provider.countDocuments({ verificationStatus: 'UNDER_REVIEW' }),
    Provider.countDocuments({ verificationStatus: 'VERIFIED' }),
    Provider.countDocuments({ verificationStatus: 'REJECTED' }),
    Provider.countDocuments({ verificationStatus: 'SUSPENDED' }),
  ])

  return {
    pending,
    underReview,
    verified,
    rejected,
    suspended,
    total: pending + underReview + verified + rejected + suspended,
  }
}

module.exports = { getVerificationSummary }
