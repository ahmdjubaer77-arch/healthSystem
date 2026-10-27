const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '..', '.env')

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (key) {
      process.env[key] = value
    }
  }
}

module.exports = process.env
