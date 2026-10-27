const path = require('path')
const multer = require('multer')

const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024
const allowedProfilePictureTypes = {
  'image/jpeg': new Set(['.jpg', '.jpeg']),
  'image/png': new Set(['.png']),
  'image/webp': new Set(['.webp']),
}

const parser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PROFILE_PICTURE_SIZE,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase()
    if (!allowedProfilePictureTypes[file.mimetype] || !allowedProfilePictureTypes[file.mimetype].has(extension)) {
      return callback(new Error('Profile picture must be JPG, JPEG, PNG, or WEBP'))
    }

    callback(null, true)
  },
})

function uploadProfilePicture(req, res, next) {
  parser.single('profilePicture')(req, res, (error) => {
    if (error) {
      const uploadError = new Error(error.code === 'LIMIT_FILE_SIZE'
        ? 'Profile picture must be 5 MB or smaller'
        : 'Profile picture must be JPG, JPEG, PNG, or WEBP')
      uploadError.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      return next(uploadError)
    }

    if (!req.file) {
      const missingFileError = new Error('A profile picture is required')
      missingFileError.statusCode = 400
      return next(missingFileError)
    }

    next()
  })
}

module.exports = { uploadProfilePicture, MAX_PROFILE_PICTURE_SIZE }
