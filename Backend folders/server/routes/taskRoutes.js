
import express from 'express'
import mongoose from 'mongoose'
import Task from '../models/Task.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

// Get all tasks for the logged-in user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id })
      .sort({ createdAt: -1 })

    res.status(200).json(tasks)
  } catch (error) {
    res.status(500).json({ message: 'Could not load tasks' })
  }
})

// Create a task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required',
      })
    }

    if (title.trim().length > 120) {
      return res.status(400).json({
        message: 'Task title must be 120 characters or fewer',
      })
    }

    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({
        message: 'Task description must be text',
      })
    }

    if (description && description.length > 2000) {
      return res.status(400).json({
        message: 'Task description must be 2000 characters or fewer',
      })
    }

    const validPriorities = ['Low', 'Medium', 'High']

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        message: 'Invalid task priority',
      })
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : null

    if (dueDate && Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid due date',
      })
    }

    const newTask = await Task.create({
      title: title.trim(),
      description: description || '',
      priority: priority || 'Medium',
      dueDate: parsedDueDate,
      user: req.user._id,
    })

    res.status(201).json(newTask)
  } catch (error) {
    res.status(500).json({ message: 'Could not create task' })
  }
})

// Update a task
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' })
    }

    const allowedUpdates = {}

    if (req.body.title !== undefined && typeof req.body.title !== 'string') {
      return res.status(400).json({ message: 'Task title must be text' })
    }

    if (typeof req.body.title === 'string') {
      if (req.body.title.trim().length > 120) {
        return res.status(400).json({
          message: 'Task title must be 120 characters or fewer',
        })
      }
      allowedUpdates.title = req.body.title.trim()
    }

    if (req.body.description !== undefined && typeof req.body.description !== 'string') {
      return res.status(400).json({ message: 'Task description must be text' })
    }

    if (typeof req.body.description === 'string') {
      if (req.body.description.length > 2000) {
        return res.status(400).json({
          message: 'Task description must be 2000 characters or fewer',
        })
      }
      allowedUpdates.description = req.body.description
    }

    if (typeof req.body.completed === 'boolean') {
      allowedUpdates.completed = req.body.completed
    }

    if (req.body.priority !== undefined) {
      const validPriorities = ['Low', 'Medium', 'High']

      if (!validPriorities.includes(req.body.priority)) {
        return res.status(400).json({
          message: 'Invalid task priority',
        })
      }

      allowedUpdates.priority = req.body.priority
    }

    if (req.body.dueDate !== undefined) {
      if (req.body.dueDate === null || req.body.dueDate === '') {
        allowedUpdates.dueDate = null
      } else {
        const parsedDueDate = new Date(req.body.dueDate)

        if (Number.isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({
            message: 'Invalid due date',
          })
        }

        allowedUpdates.dueDate = parsedDueDate
      }
    }

    if (
      allowedUpdates.title !== undefined &&
      !allowedUpdates.title
    ) {
      return res.status(400).json({
        message: 'Task title cannot be empty',
      })
    }

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' })
    }

    res.status(200).json(updatedTask)
  } catch (error) {
    res.status(500).json({ message: 'Could not update task' })
  }
})

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID' })
    }

    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' })
    }

    res.status(200).json({
      message: 'Task deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ message: 'Could not delete task' })
  }
})

export default router
