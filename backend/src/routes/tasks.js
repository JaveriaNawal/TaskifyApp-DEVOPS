const express = require('express');
const { body, param, validationResult } = require('express-validator');
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

// GET /api/tasks — list all tasks
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT id, title, description, completed, created_at FROM tasks ORDER BY created_at DESC'
    );
    res.json(result.recordset);
  } catch (err) {
    console.error('[tasks] GET / error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks' });
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
        .query('SELECT id, title, description, completed, created_at FROM tasks WHERE id = @id');

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
  async (req, res) => {
    if (handleValidation(req, res)) return;
    const { title, description = '' } = req.body;
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('title', sql.NVarChar(255), title)
        .input('description', sql.NVarChar(1000), description)
        .query(
          `INSERT INTO tasks (title, description, completed)
           OUTPUT INSERTED.id, INSERTED.title, INSERTED.description, INSERTED.completed, INSERTED.created_at
           VALUES (@title, @description, 0)`
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
  async (req, res) => {
    if (handleValidation(req, res)) return;
    const { title, description, completed } = req.body;
    try {
      const pool = await getPool();
      // Build dynamic SET clause — only update provided fields
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

      if (sets.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const result = await request.query(
        `UPDATE tasks SET ${sets.join(', ')}
         OUTPUT INSERTED.id, INSERTED.title, INSERTED.description, INSERTED.completed, INSERTED.created_at
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
