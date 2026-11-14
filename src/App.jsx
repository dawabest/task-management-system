
import { useEffect, useState } from 'react'
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from './services/taskService'
import { registerUser, loginUser } from './services/authService'
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null
    } catch {
      return null
    }
  })

  const [authMode, setAuthMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('Medium')
  const [editDueDate, setEditDueDate] = useState('')

  useEffect(() => {
    if (user) {
      loadTasks()
    } else {
      setTasks([])
    }
  }, [user])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getTasks()
      setTasks(data)
    } catch {
      setError('Tasks could not be loaded. Please login again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()

    try {
      setAuthLoading(true)
      setError('')

      const result =
        authMode === 'register'
          ? await registerUser({ name, email, password })
          : await loginUser({ email, password })

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      setUser(result.user)

      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Authentication failed. Try again.'
      )
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setTasks([])
    setFilter('all')
    setSearchTerm('')
    setError('')
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setError('')
      const newTask = await createTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
      })

      setTasks((current) => [newTask, ...current])
      setTitle('')
      setDescription('')
      setPriority('Medium')
      setDueDate('')
    } catch (err) {
      setError(err.response?.data?.message || 'Task could not be added.')
    }
  }

  const handleToggleTask = async (task) => {
    try {
      const updated = await updateTask(task._id, {
        completed: !task.completed,
      })

      setTasks((current) =>
        current.map((item) =>
          item._id === task._id ? updated : item
        )
      )
    } catch {
      setError('Task status could not be updated.')
    }
  }

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id)
      setTasks((current) =>
        current.filter((task) => task._id !== id)
      )
    } catch {
      setError('Task could not be deleted.')
    }
  }

  const startEditing = (task) => {
    setEditingId(task._id)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setEditPriority(task.priority || 'Medium')
    setEditDueDate(
      task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : ''
    )
  }

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) return

    try {
      const updated = await updateTask(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        dueDate: editDueDate || null,
      })

      setTasks((current) =>
        current.map((task) =>
          task._id === id ? updated : task
        )
      )
      setEditingId(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Task could not be edited.')
    }
  }

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length

  const pendingCount = tasks.length - completedCount

  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === 'pending'
        ? !task.completed
        : filter === 'completed'
          ? task.completed
          : true

    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      (task.description || '')
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase())

    return matchesFilter && matchesSearch
  })

  const formatDate = (date) => {
    if (!date) return 'No due date'

    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!user) {
    return (
      <main className="app-container">
        <header className="app-header">
          <div>
            <h1>TaskFlow</h1>
            <p>Organize your work and get things done.</p>
          </div>
        </header>

        <section className="task-section auth-section">
          <h2>
            {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>

          <p className="auth-description">
            {authMode === 'login'
              ? 'Login to manage your tasks.'
              : 'Create your account to get started.'}
          </p>

          <form className="task-form" onSubmit={handleAuth}>
            {authMode === 'register' && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            <button type="submit" disabled={authLoading}>
              {authLoading
                ? 'Please wait...'
                : authMode === 'login'
                  ? 'Login'
                  : 'Create Account'}
            </button>
          </form>

          {error && <p className="error-message">{error}</p>}

          <p className="auth-switch">
            {authMode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === 'login' ? 'register' : 'login'
                )
                setError('')
              }}
            >
              {authMode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </section>
      </main>
    )
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">T</span>
          <span>TaskFlow</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <button
            className={filter === 'all' ? 'nav-item active' : 'nav-item'}
            onClick={() => setFilter('all')}
          >
            <span>▦</span> All Tasks
            <span className="nav-count">{tasks.length}</span>
          </button>

          <button
            className={filter === 'pending' ? 'nav-item active' : 'nav-item'}
            onClick={() => setFilter('pending')}
          >
            <span>◷</span> Pending
            <span className="nav-count">{pendingCount}</span>
          </button>

          <button
            className={filter === 'completed' ? 'nav-item active' : 'nav-item'}
            onClick={() => setFilter('completed')}
          >
            <span>✓</span> Completed
            <span className="nav-count">{completedCount}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-info">
            <div className="profile-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="welcome-text">YOUR WORKSPACE</p>
            <h1>My Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back, {user.name}! Here's your progress.
            </p>
          </div>

          <div className="header-date">
            <span>✦</span> Stay productive
          </div>
        </header>

        {error && <p className="error-message">{error}</p>}

        <section className="stats">
          <div className="stat-card">
            <h3>Total Tasks</h3>
            <p>{tasks.length}</p>
            <small>All your tasks</small>
          </div>

          <div className="stat-card">
            <h3>Completed</h3>
            <p>{completedCount}</p>
            <small>Tasks finished</small>
          </div>

          <div className="stat-card">
            <h3>Pending</h3>
            <p>{pendingCount}</p>
            <small>Tasks remaining</small>
          </div>
        </section>

        <section className="task-section progress-section">
          <div className="progress-heading">
            <div>
              <h2>Overall Progress</h2>
              <p className="section-description">
                Your completed task percentage
              </p>
            </div>

            <strong>{progress}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="task-section">
          <div className="task-section-header">
            <div>
              <h2>Add a New Task</h2>
              <p className="section-description">
                Write down what you need to do.
              </p>
            </div>
          </div>

          <form className="task-form" onSubmit={handleAddTask}>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <textarea
              placeholder="Add a description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="task-form-options">
              <label>
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            </div>

            <button type="submit">+ Add Task</button>
          </form>
        </section>

        <section className="task-section task-list-section">
          <div className="task-section-header">
            <div>
              <h2>
                {filter === 'all'
                  ? 'All Tasks'
                  : filter === 'pending'
                    ? 'Pending Tasks'
                    : 'Completed Tasks'}
              </h2>

              <p className="section-description">
                {filteredTasks.length} task(s) found
              </p>
            </div>
          </div>

          <div className="search-box">
            <input
              type="search"
              placeholder="Search tasks by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <p>Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="empty-state">
              {searchTerm
                ? 'No tasks match your search.'
                : 'No tasks found. Add your first task!'}
            </p>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <article className="task-card" key={task._id}>
                  {editingId === task._id ? (
                    <div className="edit-form">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Task title"
                      />

                      <textarea
                        value={editDescription}
                        onChange={(e) =>
                          setEditDescription(e.target.value)
                        }
                        placeholder="Task description"
                      />

                      <div className="task-form-options">
                        <label>
                          Priority
                          <select
                            value={editPriority}
                            onChange={(e) =>
                              setEditPriority(e.target.value)
                            }
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </label>

                        <label>
                          Due Date
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) =>
                              setEditDueDate(e.target.value)
                            }
                          />
                        </label>
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(task._id)}
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="task-content">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task)}
                        />

                        <div>
                          <h3
                            className={
                              task.completed ? 'completed' : ''
                            }
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p>{task.description}</p>
                          )}

                          <div className="task-meta">
                            <span
                              className={`priority-badge priority-${(
                                task.priority || 'Medium'
                              ).toLowerCase()}`}
                            >
                              {task.priority || 'Medium'} Priority
                            </span>

                            <span className="due-date">
                              Due: {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
