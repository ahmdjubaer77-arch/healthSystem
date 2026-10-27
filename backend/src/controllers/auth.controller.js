const authService = require('../services/auth.service')

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

module.exports = { register, login, me }