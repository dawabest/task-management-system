
import axios from 'axios'

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth`,
})

// Register
export const registerUser = async (userData) => {
  const response = await API.post('/register', userData)
  return response.data
}

// Login
export const loginUser = async (userData) => {
  const response = await API.post('/login', userData)
  return response.data
}
