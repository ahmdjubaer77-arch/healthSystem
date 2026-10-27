function isAllowedClientOrigin(origin, configuredClientUrl, environment = process.env.NODE_ENV) {
  if (!origin || !configuredClientUrl) return false

  try {
    const requestOrigin = new URL(origin)
    const configuredOrigins = configuredClientUrl
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => new URL(url).origin)
    if (configuredOrigins.includes(requestOrigin.origin)) return true
    if (environment === 'production') return false

    const configuredOrigin = new URL(configuredClientUrl.split(',')[0].trim())
    const localHosts = new Set(['localhost', '127.0.0.1'])
    return requestOrigin.protocol === configuredOrigin.protocol
      && requestOrigin.port === configuredOrigin.port
      && localHosts.has(requestOrigin.hostname)
      && localHosts.has(configuredOrigin.hostname)
  } catch {
    return false
  }
}

module.exports = { isAllowedClientOrigin }
