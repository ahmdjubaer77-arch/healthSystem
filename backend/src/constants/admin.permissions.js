const ADMIN_PERMISSIONS = [
  'users.read',
  'users.update',
  'users.suspend',
  'providers.read',
  'providers.verify',
  'providers.reject',
  'providers.suspend',
  'doctors.read',
  'doctors.verify',
  'hospitals.read',
  'hospitals.verify',
  'hospitals.update',
  'pharmacies.read',
  'pharmacies.verify',
  'pharmacies.update',
  'ambulances.read',
  'ambulances.verify',
  'ambulances.update',
  'blood.read',
  'blood.moderate',
  'emergency.read',
  'emergency.manage',
  'reviews.read',
  'reviews.moderate',
  'complaints.read',
  'complaints.manage',
  'analytics.read',
  'notifications.manage',
  'settings.manage',
]

const SUPER_ADMIN_PERMISSIONS = [...ADMIN_PERMISSIONS, 'auditLogs.read', 'admins.manage', 'system.manage']

const ADMIN_ROLE_PERMISSIONS = new Set(ADMIN_PERMISSIONS)
const SUPER_ADMIN_ROLE_PERMISSIONS = new Set(SUPER_ADMIN_PERMISSIONS)

module.exports = {
  ADMIN_PERMISSIONS,
  SUPER_ADMIN_PERMISSIONS,
  ADMIN_ROLE_PERMISSIONS,
  SUPER_ADMIN_ROLE_PERMISSIONS,
}
