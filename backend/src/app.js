const express = require('express')
const healthRoutes = require('./routes/health.routes')
const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')
const userRoutes = require('./routes/user.routes')
const hospitalRoutes = require('./routes/hospital.routes')
const bloodRoutes = require('./routes/blood.routes')
const doctorRoutes = require('./routes/doctor.routes')
const ambulanceRoutes = require('./routes/ambulance.routes')
const aiRoutes = require('./routes/ai.routes')
const errorMiddleware = require('./middleware/error.middleware')
const notFoundMiddleware = require('./middleware/notFound.middleware')
const { isAllowedClientOrigin } = require('./utils/client-origin')

const app = express()

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const requestPath = req.path

    res.on('finish', () => {
      const safePath = requestPath.replace(
        /^\/api\/health\/documents\/[^/]+\/content$/,
        '/api/health/documents/:id/content',
      ).replace(
        /^\/api\/health\/shared\/[^/]+/,
        '/api/health/shared/:shareId',
      ).replace(
        /^\/api\/health\/shared\/:shareId\/documents\/[^/]+\/content$/,
        '/api/health/shared/:shareId/documents/:documentId/content',
      ).replace(
        /^\/api\/health\/shares\/[^/]+\/revoke$/,
        '/api/health/shares/:shareId/revoke',
      )
      console.log(`${req.method} ${safePath} ${res.statusCode}`)
    })
  }

  next()
})

app.use((req, res, next) => {
  const clientUrl = process.env.CLIENT_URL
  const origin = req.get('origin')

  if (isAllowedClientOrigin(origin, clientUrl)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID')
    res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID')
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', aiRoutes)
app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api', bloodRoutes)
app.use('/api', doctorRoutes)
app.use('/api', ambulanceRoutes)
app.use('/api', hospitalRoutes)

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bangladesh Digital Health & Emergency Platform API',
    data: null,
  })
})

app.use(notFoundMiddleware)
app.use(errorMiddleware)

module.exports = app
