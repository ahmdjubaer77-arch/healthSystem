const path = require('path')
const multer = require('multer')

const MAX_FILE_SIZE = 10 * 1024 * 1024
const allowedFileTypes = {
  'application/pdf': new Set(['.pdf']),
  'image/jpeg': new Set(['.jpg', '.jpeg']),
  'image/png': new Set(['.png']),
  'image/webp': new Set(['.webp']),
}

const parser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 3,
    parts: 4,
  },
  fileFilter(req, file, callback) {
    const extensions = allowedFileTypes[file.mimetype]
    const extension = path.extname(file.originalname).toLowerCase()

    if (!extensions || !extensions.has(extension)) {
      return callback(new Error('Unsupported or invalid file'))
    }

    callback(null, true)
  },
})

function uploadMedicalDocument(req, res, next) {
  parser.single('file')(req, res, (error) => {
    if (error) {
      const uploadError = new Error(error.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the 10 MB upload limit'
        : 'Unsupported or invalid file')
      uploadError.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      return next(uploadError)
    }

    if (!req.file) {
      const missingFileError = new Error('A medical document file is required')
      missingFileError.statusCode = 400
      return next(missingFileError)
    }

    next()
  })
}

module.exports = { uploadMedicalDocument, MAX_FILE_SIZE }