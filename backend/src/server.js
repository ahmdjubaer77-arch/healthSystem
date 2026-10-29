require('./config/env')

const connectDB = require('./config/db')
const app = require('./app')
const { seedSuperAdmin } = require('./services/admin.seed.service')
const emailActionService = require('./services/email-action.service')
const User = require('./models/User')
const { backfillMissingPublicUserIds } = require('./utils/public-user-id')

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    await connectDB()
    await User.init()
    await backfillMissingPublicUserIds(User)
    const superAdmin = await seedSuperAdmin()
    if (superAdmin?.emailVerificationRequired && !superAdmin.emailVerified) {
      try {
        await emailActionService.sendVerificationEmail(superAdmin._id)
      } catch (error) {
        console.error('Unable to send Super Admin verification code:', error.message)
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

    server.on('error', (error) => {
      console.error('Server startup failed:', error.message)
      process.exitCode = 1
    })
  } catch (error) {
    const safeMessage = error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, '[REDACTED_MONGODB_URI]')
    console.error('Server startup failed:', safeMessage)
    process.exitCode = 1
  }
}

startServer()
