const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { getPool, sql } = require('../db/connection');

const router = express.Router();

// Helper: send validation errors as 400
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

// GET /api/tasks — list all tasks (supports ?filter=all|pending|completed&priority=low|medium|high&search=)
router.get(
  '/',
  query('filter').optional().isIn(['all', 'pending', 'completed']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('search').optional().trim().isLength({ max: 255 }),
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const pool = await getPool();
      const request = pool.request();

      let where = [];

      // Filter by completion status
      const filter = req.query.filter || 'all';
      if (filter === 'pending')   { where.push('completed = 0'); }
      if (filter === 'completed') { where.push('completed = 1'); }

      // Filter by priority
      if (req.query.priority) {
        where.push('priority = @priority');
        request.input('priority', sql.NVarChar(10), req.query.priority);
      }

      // Search by title or description
      if (req.query.search) {
        where.push('(title LIKE @search OR description LIKE @search)');
        request.input('search', sql.NVarChar(255), `%${req.query.search}%`);
      }

      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const result = await request.query(
        `SELECT id, title, description, completed, priority, due_date, created_at
         FROM tasks
         ${whereClause}
         ORDER BY
           CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
           created_at DESC`
      );
      res.json(result.recordset);
    } catch (err) {
      console.error('[tasks] GET / error:', err.message);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
);

// GET /api/tasks/stats — summary counts
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        COUNT(*)                                    AS total,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN priority = 'high'   AND completed = 0 THEN 1 ELSE 0 END) AS high_pending,
        SUM(CASE WHEN due_date < CAST(GETUTCDATE() AS DATE) AND completed = 0 THEN 1 ELSE 0 END) AS overdue
      FROM tasks
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('[tasks] GET /stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/tasks/:id — get a single task
router.get(
  '/:id',
  param('id').isInt({ min: 1 }),
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.Int, parseInt(req.params.id))
        .query('SELECT id, title, description, completed, priority, due_date, created_at FROM tasks WHERE id = @id');

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('[tasks] GET /:id error:', err.message);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }
);

// POST /api/tasks — create a new task
router.post(
  '/',
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('due_date').optional({ nullable: true }).isISO8601().withMessage('due_date must be a valid date'),
  async (req, res) => {
    if (handleValidation(req, res)) return;
    const { title, description = '', priority = 'medium', due_date = null } = req.body;
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('title',       sql.NVarChar(255),  title)
        .input('description', sql.NVarChar(1000), description)
        .input('priority',    sql.NVarChar(10),   priority)
        .input('due_date',    sql.Date,           due_date ? new Date(due_date) : null)
        .query(
          `INSERT INTO tasks (title, description, completed, priority, due_date)
           OUTPUT INSERTED.id, INSERTED.title, INSERTED.description,
                  INSERTED.completed, INSERTED.priority, INSERTED.due_date, INSERTED.created_at
           VALUES (@title, @description, 0, @priority, @due_date)`
        );
      res.status(201).json(result.recordset[0]);
    } catch (err) {
      console.error('[tasks] POST / error:', err.message);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// PUT /api/tasks/:id — update a task
router.put(
  '/:id',
  param('id').isInt({ min: 1 }),
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('completed').optional().isBoolean(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional({ nullable: true }).isISO8601(),
  async (req, res) => {
    if (handleValidation(req, res)) return;
    const { title, description, completed, priority, due_date } = req.body;
    try {
      const pool = await getPool();
      const sets = [];
      const request = pool.request().input('id', sql.Int, parseInt(req.params.id));

      if (title !== undefined) {
        sets.push('title = @title');
        request.input('title', sql.NVarChar(255), title);
      }
      if (description !== undefined) {
        sets.push('description = @description');
        request.input('description', sql.NVarChar(1000), description);
      }
      if (completed !== undefined) {
        sets.push('completed = @completed');
        request.input('completed', sql.Bit, completed);
      }
      if (priority !== undefined) {
        sets.push('priority = @priority');
        request.input('priority', sql.NVarChar(10), priority);
      }
      if (due_date !== undefined) {
        sets.push('due_date = @due_date');
        request.input('due_date', sql.Date, due_date ? new Date(due_date) : null);
      }

      if (sets.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const result = await request.query(
        `UPDATE tasks SET ${sets.join(', ')}
         OUTPUT INSERTED.id, INSERTED.title, INSERTED.description,
                INSERTED.completed, INSERTED.priority, INSERTED.due_date, INSERTED.created_at
         WHERE id = @id`
      );

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('[tasks] PUT /:id error:', err.message);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

// DELETE /api/tasks/:id — delete a task
router.delete(
  '/:id',
  param('id').isInt({ min: 1 }),
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('id', sql.Int, parseInt(req.params.id))
        .query('DELETE FROM tasks OUTPUT DELETED.id WHERE id = @id');

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.status(204).send();
    } catch (err) {
      console.error('[tasks] DELETE /:id error:', err.message);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
);

module.exports = router;
