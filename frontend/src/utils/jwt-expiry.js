export function getJwtExpirationTime(token) {
  if (typeof token !== 'string') return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    const { exp } = JSON.parse(decoded)
    return Number.isFinite(exp) ? exp * 1000 : null
  } catch {
    return null
  }
}
