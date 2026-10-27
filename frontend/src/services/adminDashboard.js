import { getAdminDashboardSummary } from './api'

const EMPTY_SUMMARY = {
  totals: {
    totalUsers: 0,
    activeUsers: 0,
    doctors: 0,
    hospitals: 0,
    pharmacies: 0,
    ambulances: 0,
    bloodDonors: 0,
    activeBloodRequests: 0,
    emergencyRequests: 0,
    pendingVerifications: 0,
    complaints: 0,
  },
  verification: { pending: 0, verified: 0, rejected: 0 },
  recent: {
    bloodRequests: [],
    emergencyRequests: [],
    complaints: [],
    providerRegistrations: [],
  },
  source: 'database',
}

const TEMPORARY_MOCK_SUMMARY = {
  ...EMPTY_SUMMARY,
  totals: {
    ...EMPTY_SUMMARY.totals,
    totalUsers: 0,
    activeUsers: 0,
    doctors: 0,
    hospitals: 0,
    pharmacies: 0,
    ambulances: 0,
    bloodDonors: 0,
    activeBloodRequests: 0,
    emergencyRequests: 0,
    pendingVerifications: 0,
    complaints: 0,
  },
  source: 'temporary-mock',
}

export const getDashboardSummary = async (accessToken) => {
  try {
    const result = await getAdminDashboardSummary(accessToken)
    return { summary: result, source: 'database', unavailable: false }
  } catch (error) {
    return {
      summary: TEMPORARY_MOCK_SUMMARY,
      source: 'temporary-mock',
      unavailable: true,
      error,
    }
  }
}

export { EMPTY_SUMMARY }
