import { getAdminAnalytics } from './api'

const RANGE_OPTIONS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
]

export const getAdminAnalyticsData = async (accessToken, endpoint, range = '30d') => {
  const result = await getAdminAnalytics(accessToken, endpoint, range)
  return { ...result, rangeOptions: RANGE_OPTIONS }
}

export { RANGE_OPTIONS }
