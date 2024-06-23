const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const os = require('os')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/auth.js')
const groupsRoutes = require('./routes/groups.js')
const postsRoutes = require('./routes/posts.js')

require('dotenv').config()

const app = express()
app.use(bodyParser.json())
app.use(cors({ origin: 'https://localhost:3001', credentials: true }))
app.use(cookieParser())

app.use('/auth', authRoutes)
app.use('/groups', groupsRoutes)
app.use('/posts', postsRoutes)

const PORT = 23683

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})

app.use(limiter)

function getServerIPAddress() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

app.listen(PORT, () => {
  const ip = getServerIPAddress()
  console.log(`Server running at http://${ip}:${PORT}/`)
})
