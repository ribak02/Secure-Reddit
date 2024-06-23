const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const router = express.Router()

const jwtSecret = process.env.JWT_SECRET

// Registration endpoint
router.post('/register', async (req, res) => {
  const { username, password, publicKey } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)

  // Insert user into database
  const conn = await pool.getConnection()

  try {
    const insertQuery =
      'INSERT INTO users (username, password, public_key) VALUES (?, ?, ?)'
    await conn.query(insertQuery, [username, hashedPassword, publicKey])
    res.status(201).send('User registered')
  } catch (error) {
    // Check if the error is a unique constraint violation
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).send('Username already exists') // 409 Conflict
    } else {
      res.status(500).send('Internal Server Error')
    }
  } finally {
    conn.end()
  }
})

// Login endpoint
router.post('/login', async (req, res) => {
  // Check if user is already logged in
  const token = req.cookies.token
  if (token) {
    try {
      jwt.verify(token, jwtSecret)
      return res.send('Already logged in')
    } catch (error) {
      // Token is invalid, proceed with login
    }
  }

  try {
    const conn = await pool.getConnection()
    const results = await conn.query('SELECT * FROM users WHERE username = ?', [
      req.body.username,
    ])
    if (results.length > 0) {
      // Compare hashed password
      if (await bcrypt.compare(req.body.password, results[0].password)) {
        // Create and send token
        const token = jwt.sign({ userId: results[0].id }, jwtSecret, {
          expiresIn: '1h',
        })

        // Set token in httpOnly cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        })

        res.json('Login successful')
      } else {
        res.json('Wrong password')
      }
    } else {
      res.json('User not found')
    }

    conn.end()
  } catch (error) {
    res.status(500).send(error.message)
    console.log(error.message)
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  })
  res.send('Logged out successfully')
})

router.get('/check-session', (req, res) => {
  const token = req.cookies['token']
  if (!token) {
    return res.json({ loggedIn: false })
  }
  try {
    jwt.verify(token, jwtSecret)
    return res.json({ loggedIn: true })
  } catch (error) {
    return res.json({ loggedIn: false })
  }
})

module.exports = router
