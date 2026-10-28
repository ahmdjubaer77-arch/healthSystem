const RESEND_EMAILS_URL = 'https://api.resend.com/emails'
const EMAIL_DELIVERY_TIMEOUT_MS = 20_000
const SAFE_PROVIDER_ERROR_CODES = new Set([
  'EMAIL_PROVIDER_NOT_CONFIGURED',
  'EMAIL_SENDER_NOT_CONFIGURED',
  'EMAIL_SENDER_INVALID',
  'EMAIL_PROVIDER_UNAVAILABLE',
  'RESEND_SENDER_REJECTED',
  'RESEND_RECIPIENT_RESTRICTED',
  'RESEND_AUTH_FAILED',
  'RESEND_RATE_LIMITED',
  'RESEND_TIMEOUT',
  'RESEND_NETWORK_ERROR',
  'RESEND_REQUEST_REJECTED',
])

function classifyProviderFailure(status, providerError = {}) {
  const details = [providerError.name, providerError.message]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  if (/sender|from address|domain|verified/.test(details)) return 'RESEND_SENDER_REJECTED'
  if (/recipient|test mode|testing domain/.test(details)) return 'RESEND_RECIPIENT_RESTRICTED'
  if (status === 401 || /api.?key|authorization|unauthorized/.test(details)) return 'RESEND_AUTH_FAILED'
  if (status === 429) return 'RESEND_RATE_LIMITED'
  return 'RESEND_REQUEST_REJECTED'
}

function createError(message, code) {
  const error = new Error(message)
  error.code = code
  error.statusCode = 503
  return error
}

function createEmailService({ fetchImpl = globalThis.fetch, timeoutMs = EMAIL_DELIVERY_TIMEOUT_MS } = {}) {
  async function sendEmail({ to, subject, text, html }) {
    const apiKey = process.env.RESEND_API_KEY
    const sender = process.env.EMAIL_FROM?.trim()

    try {
      if (!apiKey) {
        throw createError('Resend email delivery is not configured.', 'EMAIL_PROVIDER_NOT_CONFIGURED')
      }
      if (!sender) {
        throw createError('Email sender is not configured.', 'EMAIL_SENDER_NOT_CONFIGURED')
      }
      if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(sender)) {
        throw createError('Email sender must be a valid email address.', 'EMAIL_SENDER_INVALID')
      }
      if (typeof fetchImpl !== 'function') {
        throw createError('The Node.js runtime does not support HTTPS email delivery.', 'EMAIL_PROVIDER_UNAVAILABLE')
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      let response
      try {
        response = await fetchImpl(RESEND_EMAILS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Nirogix X <${sender}>`,
            to: [to],
            subject,
            text,
            html,
          }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      if (!response.ok) {
        let providerError = {}
        try {
          providerError = await response.json()
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error
        }
        const code = classifyProviderFailure(response.status, providerError)
        const error = createError('Resend rejected the email request.', code)
        error.providerStatus = response.status
        throw error
      }
    } catch (error) {
      const knownProviderError = SAFE_PROVIDER_ERROR_CODES.has(error.code) && error.statusCode === 503
      const safeCode = knownProviderError
        ? error.code
        : error.name === 'AbortError' ? 'RESEND_TIMEOUT' : 'RESEND_NETWORK_ERROR'
      console.error('Resend email delivery failed:', {
        code: safeCode,
        ...(Number.isInteger(error.providerStatus) ? { status: error.providerStatus } : {}),
      })
      if (knownProviderError) throw error
      throw createError('Resend email delivery failed.', safeCode)
    }
  }

  return { sendEmail }
}

module.exports = { createEmailService, ...createEmailService() }
