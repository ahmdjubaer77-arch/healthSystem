require('./config/env')

const connectDB = require('./config/db')
const app = require('./app')
const { seedSuperAdmin } = require('./services/admin.seed.service')
const User = require('./models/User')
const { backfillMissingPublicUserIds } = require('./utils/public-user-id')

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    await connectDB()
    await User.init()
    await backfillMissingPublicUserIds(User)
    await seedSuperAdmin()

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

    server.on('error', (error) => {
      console.error('Server startup failed:', error.message)
      process.exitCode = 1
    })
  } catch (error) {
    const safeMessage = error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, '[REDACTED_MONGODB_URI]')
    console.error('MongoDB connection failed:', safeMessage)
    process.exitCode = 1
  }
}

startServer()
