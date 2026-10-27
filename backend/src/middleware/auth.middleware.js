const jwt = require('jsonwebtoken')

function authenticationError(code = 'AUTH_REQUIRED', message = 'Authentication required. Please sign in again.') {
  const error = new Error(message)
  error.statusCode = 401
  error.code = code
  return error
}

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || ''
  const tokenMatch = authorization.match(/^Bearer\s+(\S+)$/i)

  if (!tokenMatch) {
    return next(authenticationError())
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error('JWT_SECRET is not configured'))
  }

  try {
    const payload = jwt.verify(tokenMatch[1], process.env.JWT_SECRET)

    if (typeof payload !== 'object' || typeof payload.userId !== 'string' || typeof payload.role !== 'string') {
      return next(authenticationError())
    }

    req.user = { userId: payload.userId, role: payload.role }
    return next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(authenticationError('SESSION_EXPIRED', 'Your session has expired. Please sign in again.'))
    }
    return next(authenticationError())
  }
}

module.exports = { authenticate }