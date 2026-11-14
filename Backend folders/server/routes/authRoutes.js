
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()

const AUTH_WINDOW_MS = 15 * 60 * 1000
const AUTH_MAX_ATTEMPTS = 10
const authAttempts = new Map()
let requestsSinceCleanup = 0

const authRateLimit = (req, res, next) => {
  const now = Date.now()
  const key = req.ip || req.socket.remoteAddress || 'unknown'
  let record = authAttempts.get(key)

  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: now + AUTH_WINDOW_MS }
  }

  record.count += 1
  authAttempts.set(key, record)

  requestsSinceCleanup += 1
  if (requestsSinceCleanup >= 100) {
    for (const [ip, entry] of authAttempts) {
      if (now >= entry.resetAt) authAttempts.delete(ip)
    }
    requestsSinceCleanup = 0
  }

  res.set('RateLimit-Limit', String(AUTH_MAX_ATTEMPTS))
  res.set('RateLimit-Remaining', String(Math.max(0, AUTH_MAX_ATTEMPTS - record.count)))
  res.set('RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)))

  if (record.count > AUTH_MAX_ATTEMPTS) {
    return res.status(429).json({
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    })
  }

  next()
}

// Register a new user
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await User.findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'Email is already registered',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    })

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({
      message: 'Registration failed',
    })
  }
})

// Login an existing user
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      })
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    )

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({
      message: 'Login failed',
    })
  }
})

export default router
