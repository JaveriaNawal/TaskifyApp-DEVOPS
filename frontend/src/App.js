import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// The backend URL is injected at Docker build time via REACT_APP_API_URL
// Falls back to localhost for local development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all tasks from the backend API
  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/tasks`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(`Failed to load tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create a new task
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(`Failed to create task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle task completion
  const toggleComplete = async (task) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`);
    }
  };

  const pending = tasks.filter((t) => !t.completed).length;
  const done = tasks.filter((t) => t.completed).length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <p className="subtitle">Enterprise Azure CI/CD Lab</p>
        <div className="stats">
          <span className="stat pending">{pending} pending</span>
          <span className="stat done">{done} completed</span>
        </div>
      </header>

      <main className="app-main">
        {/* New Task Form */}
        <section className="card form-card" aria-label="Add new task">
          <h2>Add Task</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                maxLength={255}
                required
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details..."
                maxLength={1000}
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim()}>
              {submitting ? 'Adding...' : 'Add Task'}
            </button>
          </form>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => setError(null)} aria-label="Dismiss error">✕</button>
          </div>
        )}

        {/* Task List */}
        <section aria-label="Task list">
          <h2>Tasks {!loading && `(${tasks.length})`}</h2>
          {loading ? (
            <div className="loading" aria-live="polite">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="empty">No tasks yet. Add one above!</div>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task.id} className={`task-item card ${task.completed ? 'completed' : ''}`}>
                  <div className="task-content">
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleComplete(task)}
                        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                      />
                      <span className="task-title">{task.title}</span>
                    </label>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    <time className="task-date" dateTime={task.created_at}>
                      {new Date(task.created_at).toLocaleDateString()}
                    </time>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete task "${task.title}"`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
