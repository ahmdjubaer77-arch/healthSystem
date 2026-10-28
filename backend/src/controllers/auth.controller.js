const authService = require('../services/auth.service')
const otpService = require('../services/otp.service')

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user },
    })
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

async function requestEmailVerification(req, res) {
  await otpService.requestEmailVerification(req.body?.email, { waitForCompletion: false })
  res.status(200).json({
    success: true,
    message: 'If the account needs verification, a code will be sent to its email address.',
    data: null,
  })
}

async function verifyEmail(req, res, next) {
  try {
    await otpService.verifyEmail({ email: req.body?.email, code: req.body?.code })
    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

async function requestPasswordReset(req, res) {
  await otpService.requestPasswordReset(req.body?.email, { waitForCompletion: false })
  res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a verification code will be sent.',
    data: null,
  })
}

async function verifyPasswordResetCode(req, res, next) {
  try {
    const data = await otpService.confirmPasswordReset({
      email: req.body?.email,
      code: req.body?.code,
    })
    res.status(200).json({
      success: true,
      message: 'Code verified. Continue to choose a new password.',
      data,
    })
  } catch (error) {
    next(error)
  }
}

async function resetPassword(req, res, next) {
  try {
    await otpService.resetPassword({
      email: req.body?.email,
      resetToken: req.body?.resetToken,
      password: req.body?.password,
      confirmPassword: req.body?.confirmPassword,
    })
    res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  me,
  requestEmailVerification,
  verifyEmail,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword,
}