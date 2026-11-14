
import axios from 'axios'

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tasks`,
})

// Automatically attach the login token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Get all tasks
export const getTasks = async () => {
  const response = await API.get('/')
  return response.data
}

// Create a task
export const createTask = async (taskData) => {
  const response = await API.post('/', taskData)
  return response.data
}

// Update a task
export const updateTask = async (id, taskData) => {
  const response = await API.put(`/${id}`, taskData)
  return response.data
}

// Delete a task
export const deleteTask = async (id) => {
  const response = await API.delete(`/${id}`)
  return response.data
}
