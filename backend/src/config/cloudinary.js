const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

function ensureCloudinaryConfigured() {
  const configured = process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET

  if (!configured) {
    const error = new Error('Medical document storage is not configured')
    error.statusCode = 503
    throw error
  }
}

module.exports = { cloudinary, ensureCloudinaryConfigured }