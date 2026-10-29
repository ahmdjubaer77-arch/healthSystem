const authService = require('../services/auth.service')
const emailActionService = require('../services/email-action.service')

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body)
    await emailActionService.sendVerificationEmail(user.id)
    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email to verify your account before signing in.',
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}

async function resendVerification(req, res, next) {
  try {
    const data = await emailActionService.resendVerificationEmail(req.body)
    res.status(200).json({ success: true, ...data, data: null })
  } catch (error) {
    next(error)
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const data = await emailActionService.requestPasswordReset(req.body)
    res.status(200).json({ success: true, ...data, data: null })
  } catch (error) {
    next(error)
  }
}

async function verifyEmail(req, res, next) {
  try {
    const data = await emailActionService.verifyEmail(req.body)
    res.status(200).json({
      success: true,
      message: data.changed ? 'Email address changed successfully.' : 'Email verified successfully.',
      data,
    })
  } catch (error) {
    next(error)
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = await emailActionService.resetPassword(req.body)
    res.status(200).json({ success: true, message: 'Password reset successfully.', data })
  } catch (error) {
    next(error)
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data,
    })
  } catch (error) {
    next(error)
  }
}

function me(req, res) {
  res.status(200).json({
    success: true,
    message: 'Authenticated user',
    data: { user: req.user },
  })
}

module.exports = {
  register,
  resendVerification,
  requestPasswordReset,
  verifyEmail,
  resetPassword,
  login,
  me,
}