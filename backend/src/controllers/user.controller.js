const userService = require('../services/user.service')

async function getMyProfile(req, res, next) {
  try {
    const user = await userService.getMyProfile(req.user.userId)
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const user = await userService.updateMyProfile(req.user.userId, req.body)
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}

async function changeMyPassword(req, res, next) {
  try {
    const result = await userService.changeMyPassword(req.user.userId, req.body)
    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function changeMyEmail(req, res, next) {
  try {
    const result = await userService.changeMyEmail(req.user.userId, req.body)
    res.status(200).json({
      success: true,
      message: 'Email change confirmation sent.',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function deleteMyAccount(req, res, next) {
  try {
    const result = await userService.deleteMyAccount(req.user.userId, req.body)
    res.status(200).json({
      success: true,
      message: 'Your account and personal health data were deleted',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function uploadProfilePicture(req, res, next) {
  try {
    const user = await userService.uploadProfilePicture(req.user.userId, req.file)
    res.status(201).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}

async function deleteProfilePicture(req, res, next) {
  try {
    const user = await userService.deleteProfilePicture(req.user.userId)
    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully',
      data: { user },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  changeMyEmail,
  deleteMyAccount,
  uploadProfilePicture,
  deleteProfilePicture,
}