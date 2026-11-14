
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import taskRoutes from './routes/taskRoutes.js'
import authRoutes from './routes/authRoutes.js'

const app = express()

const allowedOrigins = [
  'https://task-management-system-live.vercel.app',
  'http://localhost:5173',
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '10kb' }))

app.get('/', (req, res) => {
  res.send('Task Management API is running!')
})

// Authentication routes
app.use('/api/auth', authRoutes)

// Protected task routes
app.use('/api/tasks', taskRoutes)

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    await connectDB()

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  }
}

startServer()
