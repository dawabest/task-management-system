
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import taskRoutes from './routes/taskRoutes.js'
import authRoutes from './routes/authRoutes.js'

const app = express()

app.use(cors())
app.use(express.json())

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
