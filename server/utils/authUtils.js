const jwt = require('jsonwebtoken')
require('dotenv').config()

const jwtSecret = process.env.JWT_SECRET

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.sendStatus(401)

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

module.exports = authenticateToken
