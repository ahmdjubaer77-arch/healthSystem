import {
  nearbyHospitals,
  homeServices,
} from '../data/mockData'
import { providerDirectory } from '../data/doctorMockData'
import { createBearerHeaders } from '../utils/auth-headers'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
export const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : configuredApiBaseUrl
    ? (/\/api$/i.test(configuredApiBaseUrl) ? configuredApiBaseUrl : `${configuredApiBaseUrl}/api`)
    : ''

export const loginUser = async ({ email, password }) => {
  if (!API_BASE_URL) {
    throw new Error('Login service is not configured.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the login service.')
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'Login failed. Please try again.')
    error.status = response.status
    error.code = result?.code
    throw error
  }

  if (!result.data?.user || !result.data?.accessToken) {
    throw new Error('Login service returned an invalid response.')
  }

  return result.data
}

export const registerUser = async ({ name, email, phone, password, bloodGroup, gender, dateOfBirth, location }) => {
  if (!API_BASE_URL) {
    throw new Error('Registration service is not configured.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        bloodGroup,
        gender: gender?.toUpperCase(),
        dateOfBirth,
        location,
      }),
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the registration service.')
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'Registration failed. Please try again.')
    error.status = response.status
    error.code = result?.code
    throw error
  }

  return result
}

const postAuthRequest = async (endpoint, payload, fallbackMessage) => {
  if (!API_BASE_URL) throw new Error('Authentication service is not configured.')

  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the authentication service.')
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || fallbackMessage)
    error.status = response.status
    error.code = result?.code
    throw error
  }

  return result
}

export const requestEmailVerification = (email) => postAuthRequest(
  'email/verification/request',
  { email },
  'Unable to send a verification code. Please try again.',
)

export const verifyEmailCode = (email, code) => postAuthRequest(
  'email/verification/confirm',
  { email, code },
  'Unable to verify this code. Please try again.',
)

export const requestPasswordReset = (email) => postAuthRequest(
  'password/reset/request',
  { email },
  'Unable to request a password reset. Please try again.',
)

export const verifyPasswordResetCode = (email, code) => postAuthRequest(
  'password/reset/verify',
  { email, code },
  'Unable to verify this code. Please try again.',
)

export const resetPassword = ({ email, resetToken, password, confirmPassword }) => postAuthRequest(
  'password/reset/confirm',
  { email, resetToken, password, confirmPassword },
  'Unable to reset your password. Please try again.',
)

const requestMyAccountSecurityApi = async (accessToken, endpoint, payload, fallbackMessage) => {
  if (!API_BASE_URL) throw new Error('Account security service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to update your account security.')

  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/users/me/${endpoint}`, {
      method: 'POST',
      headers: createBearerHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the account security service.')
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || fallbackMessage)
    error.status = response.status
    error.code = result?.code
    throw error
  }
  return result.data
}

export const changeAccountPassword = (accessToken, payload) => requestMyAccountSecurityApi(
  accessToken,
  'change-password',
  payload,
  'Unable to change your password.',
)

export const requestAccountEmailChange = (accessToken, email) => requestMyAccountSecurityApi(
  accessToken,
  'email-change/request',
  { email },
  'Unable to send a verification code.',
)

export const confirmAccountEmailChange = (accessToken, code) => requestMyAccountSecurityApi(
  accessToken,
  'email-change/confirm',
  { code },
  'Unable to verify this email change.',
)

export const submitFeedback = async (accessToken, { category, message }) => {
  if (!API_BASE_URL) {
    throw new Error('Feedback service is not configured.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/users/feedback`, {
      method: 'POST',
      headers: createBearerHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ category, message }),
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the feedback service.')
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'Unable to send your feedback. Please try again.')
    error.status = response.status
    throw error
  }

  return result.data
}

export const getBackendHealth = async () => {
  try {
    if (!API_BASE_URL) {
      throw new Error('Missing API base URL')
    }

    const response = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error('Backend returned an unsuccessful response')
    }

    return await response.json()
  } catch {
    throw new Error('Backend connection failed')
  }
}

export const getAdminAnalytics = async (accessToken, endpoint, range = '30d') => {
  return requestAdminApi(`/analytics/${endpoint}?range=${encodeURIComponent(range)}`, { accessToken })
}

export const getAdminDashboardSummary = async (accessToken) => {
  if (!API_BASE_URL) {
    throw new Error('Admin service is not configured.')
  }

  if (!accessToken) {
    throw new Error('Please sign in again to access the admin panel.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the admin dashboard service.')
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'Unable to load the dashboard summary.')
    error.status = response.status
    throw error
  }

  return result.data
}

export const createAdminAccount = async (accessToken, payload) => {
  return requestAdminApi('/admins', {
    accessToken,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const checkAdminAuthorization = async (accessToken) => {
  if (!API_BASE_URL) {
    throw new Error('Admin service is not configured.')
  }

  if (!accessToken) {
    throw new Error('Please sign in again to access the admin panel.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/admin/auth/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the admin service.')
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'Admin authorization failed.')
    error.status = response.status
    throw error
  }

  return result.data
}

const requestAdminApi = async (path, options = {}) => {
  if (!API_BASE_URL) throw new Error('Admin service is not configured.')
  if (!options.accessToken) throw new Error('Please sign in again to access the admin panel.')

  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  })
  const result = await response.json()

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'The admin request failed.')
    error.status = response.status
    throw error
  }

  return result.data
}

export const getAdminUsers = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  return requestAdminApi(`/users?${params.toString()}`, { accessToken })
}

export const getAdminUser = async (accessToken, id) => requestAdminApi(`/users/${id}`, { accessToken })

export const updateAdminUserStatus = async (accessToken, id, status) => requestAdminApi(`/users/${id}/status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

export const updateAdminUserRole = async (accessToken, id, role) => requestAdminApi(`/users/${id}/role`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ role }),
})

export const getAdminProviders = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  return requestAdminApi(`/providers?${params.toString()}`, { accessToken })
}

export const getAdminProvider = async (accessToken, id) => requestAdminApi(`/providers/${id}`, { accessToken })

export const getAdminDoctors = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  return requestAdminApi(`/doctors?${params.toString()}`, { accessToken })
}

export const getAdminDoctor = async (accessToken, id) => requestAdminApi(`/doctors/${id}`, { accessToken })

export const createAdminDoctor = async (accessToken, payload) => requestAdminApi('/doctors', {
  accessToken,
  method: 'POST',
  body: JSON.stringify(payload),
})

export const updateAdminDoctor = async (accessToken, id, payload) => requestAdminApi(`/doctors/${id}`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify(payload),
})

export const getAdminDoctorCredentialUrl = async (accessToken, id, credentialId) => requestAdminApi(`/doctors/${id}/credentials/${credentialId}`, { accessToken })

export const updateAdminDoctorVerification = async (accessToken, id, status, reason = '') => requestAdminApi(`/doctors/${id}/verification`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status, reason }),
})

export const updateAdminDoctorStatus = async (accessToken, id, status) => requestAdminApi(`/doctors/${id}/status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

export const getAdminAmbulances = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  return requestAdminApi(`/ambulances?${params.toString()}`, { accessToken })
}

export const getAdminAmbulance = async (accessToken, id) => requestAdminApi(`/ambulances/${id}`, { accessToken })

export const createAdminAmbulance = async (accessToken, payload) => requestAdminApi('/ambulances', {
  accessToken,
  method: 'POST',
  body: JSON.stringify(payload),
})

export const updateAdminAmbulance = async (accessToken, id, payload) => requestAdminApi(`/ambulances/${id}`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify(payload),
})

export const updateAdminAmbulanceVerification = async (accessToken, id, status, reason = '') => requestAdminApi(`/ambulances/${id}/verification`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status, reason }),
})

export const updateAdminAmbulanceStatus = async (accessToken, id, status) => requestAdminApi(`/ambulances/${id}/status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

export const updateAdminAmbulanceOperationalStatus = async (accessToken, id, operationalStatus) => requestAdminApi(`/ambulances/${id}/operational-status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ operationalStatus }),
})

export const getAmbulances = async (query = {}) => {
  if (!API_BASE_URL) throw new Error('Ambulance service is not configured.')
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/ambulances?${params.toString()}`, { cache: 'no-store' })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the ambulance service.')
  }
  if (!response.ok || result?.success !== true) throw new Error(result?.message || 'Unable to load ambulances.')
  return result.data
}

export const getAmbulanceById = async (id) => {
  if (!API_BASE_URL) throw new Error('Ambulance service is not configured.')
  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/ambulances/${encodeURIComponent(id)}`, { cache: 'no-store' })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the ambulance service.')
  }
  if (!response.ok || result?.success !== true) throw new Error(result?.message || 'Unable to load ambulance details.')
  return result.data?.ambulance ?? null
}

export const getAdminHospitals = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  return requestAdminApi(`/hospitals?${params.toString()}`, { accessToken })
}

export const getAdminHospital = async (accessToken, id) => requestAdminApi(`/hospitals/${id}`, { accessToken })

export const createAdminHospital = async (accessToken, payload) => requestAdminApi('/hospitals', {
  accessToken,
  method: 'POST',
  body: JSON.stringify(payload),
})

export const updateAdminHospital = async (accessToken, id, payload) => requestAdminApi(`/hospitals/${id}`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify(payload),
})

export const updateAdminHospitalStatus = async (accessToken, id, status) => requestAdminApi(`/hospitals/${id}/status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

export const updateAdminHospitalVerification = async (accessToken, id, status, reason = '') => requestAdminApi(`/hospitals/${id}/verification`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status, reason }),
})

export const getAdminPharmacies = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  return requestAdminApi(`/pharmacies?${params.toString()}`, { accessToken })
}

export const getAdminPharmacy = async (accessToken, id) => requestAdminApi(`/pharmacies/${id}`, { accessToken })

export const createAdminPharmacy = async (accessToken, payload) => requestAdminApi('/pharmacies', {
  accessToken,
  method: 'POST',
  body: JSON.stringify(payload),
})

export const updateAdminPharmacy = async (accessToken, id, payload) => requestAdminApi(`/pharmacies/${id}`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify(payload),
})

export const updateAdminPharmacyStatus = async (accessToken, id, status) => requestAdminApi(`/pharmacies/${id}/status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

export const updateAdminPharmacyVerification = async (accessToken, id, status, reason = '') => requestAdminApi(`/pharmacies/${id}/verification`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status, reason }),
})

export const getAdminVerificationSummary = async (accessToken) => requestAdminApi('/verification/summary', { accessToken })

export const getAdminAuditLogs = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => { if (value !== '' && value !== null && value !== undefined) params.set(key, String(value)) })
  return requestAdminApi(`/audit-logs?${params.toString()}`, { accessToken })
}

export const getAdminBloodRequests = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => { if (value !== '' && value !== null && value !== undefined) params.set(key, String(value)) })
  return requestAdminApi(`/blood/requests?${params.toString()}`, { accessToken })
}

export const getAdminBloodRequest = async (accessToken, id) => requestAdminApi(`/blood/requests/${id}`, { accessToken })

export const getAdminBloodDonors = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  return requestAdminApi(`/blood/donors?${params.toString()}`, { accessToken })
}

export const getAdminBloodDonorPatientAccounts = async (accessToken, search) => {
  const params = new URLSearchParams({ search })
  return requestAdminApi(`/blood/donors/patient-accounts?${params.toString()}`, { accessToken })
}

export const getAdminBloodDonor = async (accessToken, id) => requestAdminApi(`/blood/donors/${id}`, { accessToken })

export const addAdminBloodDonor = async (accessToken, payload) => requestAdminApi('/blood/donors', {
  accessToken,
  method: 'POST',
  body: JSON.stringify(payload),
})

export const updateAdminBloodDonor = async (accessToken, id, payload) => requestAdminApi(`/blood/donors/${id}`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify(payload),
})

export const updateAdminBloodDonorAvailability = async (accessToken, id, availability) => requestAdminApi(`/blood/donors/${id}/availability`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ availability }),
})

export const verifyAdminBloodDonor = async (accessToken, id, decision = {}) => requestAdminApi(`/blood/donors/${id}/verification`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify(decision),
})

export const updateAdminBloodDonorStatus = async (accessToken, id, status) => requestAdminApi(`/blood/donors/${id}/status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

export const updateAdminBloodRequestStatus = async (accessToken, id, status, reason = '') => requestAdminApi(`/blood/requests/${id}/status`, { accessToken, method: 'PATCH', body: JSON.stringify({ status, reason }) })

export const reportAdminBloodRequest = async (accessToken, id, reason) => requestAdminApi(`/blood/requests/${id}/report`, { accessToken, method: 'POST', body: JSON.stringify({ reason }) })

export const getAdminEmergencyRequests = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => { if (value !== '' && value !== null && value !== undefined) params.set(key, String(value)) })
  return requestAdminApi(`/emergency/requests?${params.toString()}`, { accessToken })
}

export const getAdminEmergencyRequest = async (accessToken, id) => requestAdminApi(`/emergency/requests/${id}`, { accessToken })

export const updateAdminEmergencyRequestStatus = async (accessToken, id, status, reason = '') => requestAdminApi(`/emergency/requests/${id}/status`, { accessToken, method: 'PATCH', body: JSON.stringify({ status, reason }) })

export const getAdminComplaints = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  return requestAdminApi(`/complaints?${params.toString()}`, { accessToken })
}

export const getAdminComplaint = async (accessToken, id) => requestAdminApi(`/complaints/${id}`, { accessToken })

export const assignAdminComplaint = async (accessToken, id, adminId) => requestAdminApi(`/complaints/${id}/assignment`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ adminId }),
})

export const addAdminComplaintNote = async (accessToken, id, note) => requestAdminApi(`/complaints/${id}/notes`, {
  accessToken,
  method: 'POST',
  body: JSON.stringify({ note }),
})

export const updateAdminComplaintStatus = async (accessToken, id, status) => requestAdminApi(`/complaints/${id}/status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

export const resolveAdminComplaint = async (accessToken, id, resolutionInfo) => requestAdminApi(`/complaints/${id}/resolve`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ resolutionInfo }),
})

export const rejectAdminComplaint = async (accessToken, id, reason) => requestAdminApi(`/complaints/${id}/reject`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ reason }),
})

export const escalateAdminComplaint = async (accessToken, id, reason) => requestAdminApi(`/complaints/${id}/escalate`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ reason }),
})

export const updateAdminProviderStatus = async (accessToken, id, status, reason = '') => requestAdminApi(`/providers/${id}/status`, {
  accessToken,
  method: 'PATCH',
  body: JSON.stringify({ status, reason }),
})

export const getCurrentUser = async (accessToken) => {
  if (!API_BASE_URL) {
    throw new Error('User profile service is not configured.')
  }

  if (!accessToken) {
    throw new Error('Please sign in again to view your user profile.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the user profile service.')
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || 'Unable to load your user profile.')
    error.status = response.status
    error.code = result?.code
    throw error
  }

  return result.data?.user
}

export const updateUserProfile = async (accessToken, payload) => {
  if (!API_BASE_URL) throw new Error('User profile service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to update your profile.')

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const result = await response.json()

  if (!response.ok || result?.success !== true || !result.data?.user) {
    throw new Error(result?.message || 'Unable to update your profile.')
  }

  return result.data.user
}

export const deleteMyAccount = async (accessToken, currentPassword) => {
  if (!API_BASE_URL) throw new Error('User account service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to delete your account.')

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword }),
    cache: 'no-store',
  })
  const result = await response.json()

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to delete your account.')
  }

  return result.data
}

export const getHealthProfile = async (accessToken) => {
  if (!API_BASE_URL) {
    throw new Error('Health profile service is not configured.')
  }

  if (!accessToken) {
    throw new Error('Please sign in again to view your health profile.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/health/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the health profile service.')
  }

  if (response.status === 404) {
    return null
  }

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to load your health profile.')
  }

  return result.data?.healthProfile ?? null
}

export const saveHealthProfile = async (accessToken, payload, exists) => {
  if (!API_BASE_URL) throw new Error('Health profile service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to save your health profile.')

  const response = await fetch(`${API_BASE_URL}/health/profile`, {
    method: exists ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const result = await response.json()

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to save your health profile.')
  }

  return result.data?.healthProfile
}

export const getHealthTimeline = async (accessToken) => {
  const result = await getHealthTimelinePage(accessToken, { page: 1, limit: 100 })
  if (result.pagination.totalPages <= 1) return result.timeline

  const remainingPages = await Promise.all(
    Array.from({ length: result.pagination.totalPages - 1 }, (_, index) => (
      getHealthTimelinePage(accessToken, { page: index + 2, limit: 100 })
    )),
  )
  return [result, ...remainingPages].flatMap((page) => page.timeline)
}

const requestHealthSharingApi = async (path, accessToken, options = {}, serviceName = 'Health sharing') => {
  if (!API_BASE_URL) throw new Error(`${serviceName} service is not configured.`)
  if (!accessToken) throw new Error(`Please sign in again to use ${serviceName.toLowerCase()}.`)

  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...createBearerHeaders(accessToken, options.headers),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      cache: 'no-store',
    })
  } catch {
    const error = new Error(`Unable to connect to the ${serviceName.toLowerCase()} service. Check your connection and try again.`)
    error.code = 'NETWORK_ERROR'
    throw error
  }

  try {
    result = await response.json()
  } catch {
    const message = response.status >= 500
      ? `The ${serviceName.toLowerCase()} service is unavailable. Check that the backend is running and try again.`
      : `The ${serviceName.toLowerCase()} service returned an invalid response. Please try again.`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  if (!response.ok || result?.success !== true) {
    const error = new Error(result?.message || `The ${serviceName.toLowerCase()} request failed.`)
    error.status = response.status
    error.code = result?.code
    throw error
  }
  return result.data ?? result
}

export const sendAssistantMessage = async (
  accessToken,
  message,
  conversation,
  consent,
  language,
  { signal, requestId, onDelta, onReplace } = {},
) => {
  if (!API_BASE_URL) throw new Error('Assistant service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to use the assistant.')

  let response
  try {
    response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        ...createBearerHeaders(accessToken),
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ message, conversation, consent, language }),
      cache: 'no-store',
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    const networkError = new Error('Unable to connect to the assistant service. Check your connection and try again.')
    networkError.code = 'NETWORK_ERROR'
    throw networkError
  }

  if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
    let result
    try {
      result = await response.json()
    } catch {
      throw new Error(response.status >= 500
        ? 'The assistant service is unavailable. Please try again later.'
        : 'The assistant service returned an invalid response. Please try again.')
    }
    const error = new Error(result?.message || 'The assistant request failed.')
    error.status = response.status
    error.code = result?.code
    throw error
  }

  if (!response.body) throw new Error('The assistant response could not be streamed.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let reply = ''
  let completion = null

  const processEvent = (rawEvent) => {
    let eventType = ''
    let data = ''
    for (const line of rawEvent.split(/\r?\n/)) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim()
      else if (line.startsWith('data:')) data += line.slice(5).trim()
    }
    if (!data) return
    let payload
    try {
      payload = JSON.parse(data)
    } catch {
      throw new Error('The assistant returned an invalid response. Please try again.')
    }

    if (eventType === 'delta') {
      if (typeof payload.text !== 'string') throw new Error('The assistant returned an invalid response. Please try again.')
      reply += payload.text
      onDelta?.(payload.text)
    } else if (eventType === 'replace') {
      if (typeof payload.text !== 'string') throw new Error('The assistant returned an invalid response. Please try again.')
      reply = payload.text
      onReplace?.(reply)
    } else if (eventType === 'done') {
      completion = payload
    } else if (eventType === 'error') {
      const error = new Error(payload.message || 'The assistant is temporarily unavailable.')
      error.code = payload.code
      throw error
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() || ''
      for (const event of events) processEvent(event)
      if (done) break
    }
    if (buffer.trim()) processEvent(buffer)
  } catch (error) {
    await reader.cancel().catch(() => {})
    throw error
  } finally {
    reader.releaseLock()
  }

  if (!completion) throw new Error('The assistant returned an incomplete response. Please try again.')
  return { ...completion, reply, requestId: response.headers.get('X-Request-ID') || requestId }
}

export const lookupHealthShareRecipient = async (accessToken, publicUserId) => {
  const query = new URLSearchParams()
  const normalizedPublicUserId = publicUserId.trim().toUpperCase()
  query.set('publicUserId', normalizedPublicUserId)
  const suffix = query.toString() ? `?${query}` : ''
  const result = await requestHealthSharingApi(`/health/shares/recipient${suffix}`, accessToken)
  const recipient = result?.recipient
    ?? (typeof result?.name === 'string' && typeof result?.maskedUserId === 'string' ? result : null)
  if (
    !recipient
    || typeof recipient.name !== 'string'
    || typeof recipient.maskedUserId !== 'string'
  ) {
    const error = new Error('The account lookup returned an unexpected response. Please try again or contact support.')
    error.code = 'INVALID_LOOKUP_RESPONSE'
    throw error
  }

  return {
    name: recipient.name,
    maskedUserId: recipient.maskedUserId,
    publicUserId: normalizedPublicUserId,
  }
}

export const getHealthShares = async (accessToken) => {
  const result = await requestHealthSharingApi('/health/shares', accessToken)
  return result.shares || []
}

export const createHealthShare = async (accessToken, payload) => {
  const result = await requestHealthSharingApi('/health/shares', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return result.share
}

export const revokeHealthShare = async (accessToken, shareId) => {
  const result = await requestHealthSharingApi(`/health/shares/${encodeURIComponent(shareId)}/revoke`, accessToken, {
    method: 'POST',
  })
  return result.share
}

export const getHealthAccessHistory = async (accessToken, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  const suffix = params.toString() ? `?${params}` : ''
  return requestHealthSharingApi(`/health/access-history${suffix}`, accessToken)
}

export const getReceivedHealthShares = async (accessToken) => {
  const result = await requestHealthSharingApi('/health/shares/received', accessToken)
  return result.shares || []
}

export const getSharedHealthProfile = async (accessToken, shareId) => {
  const result = await requestHealthSharingApi(
    `/health/shared/${encodeURIComponent(shareId)}/profile`,
    accessToken,
  )
  return result.profile
}

export const getSharedHealthTimeline = async (accessToken, shareId, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  const suffix = params.toString() ? `?${params}` : ''
  return requestHealthSharingApi(
    `/health/shared/${encodeURIComponent(shareId)}/timeline${suffix}`,
    accessToken,
  )
}

export const getSharedHealthDocuments = async (accessToken, shareId, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  const suffix = params.toString() ? `?${params}` : ''
  return requestHealthSharingApi(
    `/health/shared/${encodeURIComponent(shareId)}/documents${suffix}`,
    accessToken,
  )
}

export const getSharedMedicalDocumentContent = async (accessToken, shareId, documentId) => {
  if (!API_BASE_URL) throw new Error('Shared medical document service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to view this shared document.')

  let response
  try {
    response = await fetch(
      `${API_BASE_URL}/health/shared/${encodeURIComponent(shareId)}/documents/${encodeURIComponent(documentId)}/content`,
      {
        headers: createBearerHeaders(accessToken),
        cache: 'no-store',
      },
    )
  } catch {
    const error = new Error('Unable to connect to the shared medical document service.')
    error.code = 'NETWORK_ERROR'
    throw error
  }

  if (!response.ok) {
    let message = 'Unable to retrieve this shared document.'
    try {
      const result = await response.json()
      message = result?.message || message
    } catch {
      if (response.status >= 500) message = 'The shared medical document service is unavailable. Please try again.'
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return response.blob()
}

export const getHealthTimelinePage = async (accessToken, { page = 1, limit = 20, from, to } = {}) => {
  if (!API_BASE_URL) throw new Error('Health timeline service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to view your health records.')

  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (from) query.set('from', from)
  if (to) query.set('to', to)
  const response = await fetch(`${API_BASE_URL}/health/timeline?${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  const result = await response.json()

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to load your health records.')
  }

  return {
    timeline: result.data?.timeline || [],
    pagination: result.data?.pagination || { page, limit, total: 0, totalPages: 0 },
  }
}

export const saveTimelineEntry = async (accessToken, entryId, payload) => {
  if (!API_BASE_URL) throw new Error('Health timeline service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to save your health records.')

  const url = entryId ? `${API_BASE_URL}/health/timeline/${entryId}` : `${API_BASE_URL}/health/timeline`
  const response = await fetch(url, {
    method: entryId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const result = await response.json()

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to save this health record.')
  }

  return result.data?.timelineEntry
}

export const deleteTimelineEntry = async (accessToken, entryId) => {
  if (!API_BASE_URL) throw new Error('Health timeline service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to delete this health record.')

  const response = await fetch(`${API_BASE_URL}/health/timeline/${entryId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const result = await response.json()

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to delete this health record.')
  }

  return result.data
}

export const uploadProfilePicture = async (accessToken, formData) => {
  if (!API_BASE_URL) {
    throw new Error('Profile picture service is not configured.')
  }

  if (!accessToken) {
    throw new Error('Please sign in again to upload your profile picture.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/users/me/profile-picture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the profile picture service.')
  }

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to upload the profile picture.')
  }

  return result.data?.user
}

export const deleteProfilePicture = async (accessToken) => {
  if (!API_BASE_URL) {
    throw new Error('Profile picture service is not configured.')
  }

  if (!accessToken) {
    throw new Error('Please sign in again to delete your profile picture.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/users/me/profile-picture`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the profile picture service.')
  }

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to delete the profile picture.')
  }

  return result.data?.user
}

export const uploadMedicalDocument = async (accessToken, formData) => {
  if (!API_BASE_URL) {
    throw new Error('Medical document service is not configured.')
  }

  if (!accessToken) {
    throw new Error('Please sign in again to upload this document.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/health/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the medical document service.')
  }

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to upload the medical document.')
  }

  return result.data?.document
}

export const getMedicalDocuments = async (accessToken) => {
  if (!API_BASE_URL) {
    throw new Error('Medical document service is not configured.')
  }

  if (!accessToken) {
    throw new Error('Please sign in again to view your medical documents.')
  }

  let response
  let result

  try {
    response = await fetch(`${API_BASE_URL}/health/documents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the medical document service.')
  }

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'Unable to load your medical documents.')
  }

  return result.data?.documents ?? []
}

export const getMedicalDocumentContent = async (accessToken, documentId) => {
  if (!API_BASE_URL) throw new Error('Medical document service is not configured.')
  if (!accessToken) throw new Error('Please sign in again to view this medical document.')

  let response
  try {
    response = await fetch(`${API_BASE_URL}/health/documents/${encodeURIComponent(documentId)}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
  } catch {
    throw new Error('Unable to connect to the medical document service.')
  }

  if (!response.ok) {
    let message = 'Unable to retrieve this medical document.'
    try {
      const result = await response.json()
      message = result?.message || message
    } catch {
      // Use the status-aware message when the server does not return JSON.
    }

    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return response.blob()
}

export const getHomeServices = async () => homeServices

export const getNearbyHospitals = async () => nearbyHospitals

export const getPublicHospitals = async (query = {}) => {
  if (!API_BASE_URL) throw new Error('Hospital service is not configured.')
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/hospitals?${params.toString()}`, { cache: 'no-store' })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the hospital service.')
  }
  if (!response.ok || result?.success !== true) throw new Error(result?.message || 'Unable to load hospitals.')
  return result.data
}

export const getPublicHospitalById = async (id) => {
  if (!API_BASE_URL) throw new Error('Hospital service is not configured.')
  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/hospitals/${encodeURIComponent(id)}`, { cache: 'no-store' })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the hospital service.')
  }
  if (!response.ok || result?.success !== true) throw new Error(result?.message || 'Unable to load hospital details.')
  return result.data?.hospital || null
}

export const getPublicLocationOptions = async (category, filters = {}) => {
  if (!API_BASE_URL) throw new Error('Location service is not configured.')
  const params = new URLSearchParams({ category })
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/locations/options?${params.toString()}`, { cache: 'no-store' })
    result = await response.json()
  } catch {
    throw new Error('Unable to load location options.')
  }
  if (!response.ok || result?.success !== true) throw new Error(result?.message || 'Unable to load location options.')
  return result.data
}

export const getBloodDonors = async (query = {}) => {
  if (!API_BASE_URL) throw new Error('Blood donor service is not configured.')
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })

  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/blood/donors?${params.toString()}`, { cache: 'no-store' })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the blood donor service.')
  }
  if (!response.ok || result?.success !== true) throw new Error(result?.message || 'Unable to load blood donors.')
  return result.data
}

export const getDoctors = async (query = {}) => {
  if (!API_BASE_URL) throw new Error('Doctor service is not configured.')
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params.set(key, String(value))
  })
  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/doctors?${params.toString()}`, { cache: 'no-store' })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the doctor service.')
  }
  if (!response.ok || result?.success !== true) throw new Error(result?.message || 'Unable to load doctors.')
  return result.data
}

export const getDoctorById = async (id) => {
  if (!API_BASE_URL) throw new Error('Doctor service is not configured.')
  let response
  let result
  try {
    response = await fetch(`${API_BASE_URL}/doctors/${encodeURIComponent(id)}`, { cache: 'no-store' })
    result = await response.json()
  } catch {
    throw new Error('Unable to connect to the doctor service.')
  }
  if (!response.ok || result?.success !== true) throw new Error(result?.message || 'Unable to load doctor details.')
  return result.data?.doctor ?? null
}

export const getProviders = async () => providerDirectory

export const getProviderById = async (id) => providerDirectory.find((provider) => provider.id === id) ?? null

export const createAppointmentRequest = async (payload) => ({
  status: 'demo',
  message: 'Appointment request created in the frontend prototype only.',
  payload,
})

export const getHealthSummary = async () => ({
  status: 'demo',
  title: 'Prototype health overview',
  message: 'This is demo/mock data for front-end development only.',
})
