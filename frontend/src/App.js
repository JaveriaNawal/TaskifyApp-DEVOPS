import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#ef4444', bg: '#fef2f2', icon: '🔴' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fffbeb', icon: '🟡' },
  low:    { label: 'Low',    color: '#22c55e', bg: '#f0fdf4', icon: '🟢' },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr, completed) {
  if (!dateStr || completed) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

// ── Stats Bar ─────────────────────────────────────────────
function StatsBar({ stats }) {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-num">{stats.total ?? '—'}</span>
        <span className="stat-label">Total</span>
      </div>
      <div className="stat-item pending">
        <span className="stat-num">{stats.pending ?? '—'}</span>
        <span className="stat-label">Pending</span>
      </div>
      <div className="stat-item done">
        <span className="stat-num">{stats.completed ?? '—'}</span>
        <span className="stat-label">Done</span>
      </div>
      <div className="stat-item urgent">
        <span className="stat-num">{stats.high_pending ?? '—'}</span>
        <span className="stat-label">Urgent</span>
      </div>
      {stats.overdue > 0 && (
        <div className="stat-item overdue">
          <span className="stat-num">{stats.overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      )}
    </div>
  );
}

// ── Task Form ─────────────────────────────────────────────
function TaskForm({ onAdd }) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState('medium');
  const [dueDate, setDueDate]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen]             = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAdd({ title: title.trim(), description: description.trim(), priority, due_date: dueDate || null });
      setTitle(''); setDescription(''); setPriority('medium'); setDueDate('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card card">
      {!open ? (
        <button className="add-trigger" onClick={() => setOpen(true)}>
          <span className="plus-icon">+</span> Add new task
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="task-form">
          <h2>New Task</h2>
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="title">Title <span className="required">*</span></label>
              <input
                id="title" ref={titleRef} type="text" value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?" maxLength={255} required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..." maxLength={1000} rows={2}
            />
          </div>
          <div className="form-row gap">
            <div className="form-group flex-1">
              <label htmlFor="priority">Priority</label>
              <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div className="form-group flex-1">
              <label htmlFor="due_date">Due Date</label>
              <input id="due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim()}>
              {submitting ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Inline Edit Form ──────────────────────────────────────
function EditForm({ task, onSave, onCancel }) {
  const [title, setTitle]           = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority]     = useState(task.priority || 'medium');
  const [dueDate, setDueDate]       = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [saving, setSaving]         = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(task.id, { title: title.trim(), description: description.trim(), priority, due_date: dueDate || null });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="edit-form" onSubmit={handleSave}>
      <input
        className="edit-title-input" type="text" value={title}
        onChange={(e) => setTitle(e.target.value)} maxLength={255} required autoFocus
      />
      <textarea
        className="edit-desc-input" value={description}
        onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={2}
        placeholder="Description..."
      />
      <div className="edit-row">
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="edit-select">
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="edit-date" />
        <div className="edit-actions">
          <button type="button" className="btn btn-ghost btn-xs" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-xs" disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Task Item ─────────────────────────────────────────────
function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const overdue = isOverdue(task.due_date, task.completed);
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(task.id);
  };

  const handleSave = async (id, data) => {
    await onEdit(id, data);
    setEditing(false);
  };

  return (
    <li className={`task-item card ${task.completed ? 'completed' : ''} ${overdue ? 'overdue-item' : ''} ${deleting ? 'deleting' : ''}`}>
      {editing ? (
        <EditForm task={task} onSave={handleSave} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <div className="task-left">
            <button
              className={`checkbox ${task.completed ? 'checked' : ''}`}
              onClick={() => onToggle(task)}
              aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
            >
              {task.completed && <span className="checkmark">✓</span>}
            </button>
            <div className="task-body">
              <div className="task-title-row">
                <span className="task-title">{task.title}</span>
                <span className="priority-badge" style={{ color: p.color, background: p.bg }}>
                  {p.icon} {p.label}
                </span>
              </div>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-meta">
                {task.due_date && (
                  <span className={`due-date ${overdue ? 'overdue' : ''}`}>
                    {overdue ? '⚠️ Overdue · ' : '📅 '}{formatDate(task.due_date)}
                  </span>
                )}
                <span className="created-date">Added {formatDate(task.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="task-actions">
            <button className="btn-icon" onClick={() => setEditing(true)} aria-label="Edit task" title="Edit">
              ✏️
            </button>
            <button className="btn-icon danger" onClick={handleDelete} aria-label="Delete task" title="Delete">
              🗑️
            </button>
          </div>
        </>
      )}
    </li>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks]       = useState([]);
  const [stats, setStats]       = useState({});
  const [filter, setFilter]     = useState('all');
  const [priority, setPriority] = useState('');
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/stats`);
      if (res.ok) setStats(await res.json());
    } catch (_) {}
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (priority)         params.set('priority', priority);
      if (search.trim())    params.set('search', search.trim());
      const res = await fetch(`${API_URL}/api/tasks?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks(await res.json());
    } catch (err) {
      setError(`Failed to load tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [filter, priority, search]);

  useEffect(() => { fetchTasks(); fetchStats(); }, [fetchTasks, fetchStats]);

  const handleAdd = async (data) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchTasks();
      await fetchStats();
    } catch (err) {
      setError(`Failed to create task: ${err.message}`);
      throw err;
    }
  };

  const handleToggle = async (task) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      fetchStats();
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
    }
  };

  const handleEdit = async (id, data) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      fetchStats();
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      fetchStats();
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">✅</span>
          <div>
            <h1>TaskFlow</h1>
            <p className="subtitle">Enterprise Azure CI/CD Lab</p>
          </div>
        </div>
        <StatsBar stats={stats} />
      </header>

      <main className="app-main">
        {/* Error Banner */}
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss">✕</button>
          </div>
        )}

        {/* Add Task */}
        <TaskForm onAdd={handleAdd} />

        {/* Filters & Search */}
        <div className="toolbar card">
          <div className="filter-tabs">
            {['all', 'pending', 'completed'].map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select
              className="priority-filter"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="search"
                placeholder="Search tasks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search tasks"
              />
            </div>
          </div>
        </div>

        {/* Task List */}
        <section aria-label="Task list">
          {loading ? (
            <div className="state-box">
              <div className="spinner" aria-label="Loading" />
              <p>Loading tasks…</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="state-box empty">
              <span className="empty-icon">📋</span>
              <p>{search || priority ? 'No tasks match your filters.' : 'No tasks yet — add one above!'}</p>
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>TaskFlow · Azure App Service · Southeast Asia</span>
        <a href={`${API_URL}/api/health`} target="_blank" rel="noreferrer">API Health ↗</a>
      </footer>
    </div>
  );
}
