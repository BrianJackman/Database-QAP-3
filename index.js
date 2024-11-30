const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;

app.use(express.json());

// PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Task_manager_db',
  password: 'PostgresPass',
  port: 5432,
});

// Function to create the tasks table if it doesn't exist
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      description VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL
    );
  `;
  await pool.query(query);
};

createTable().catch(err => console.error('Error creating table:', err));

// GET /tasks - Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /tasks - Add a new task
app.post('/tasks', async (req, res) => {
  const { description, status } = req.body;
  if (!description || !status) {
    return res.status(400).json({ error: 'All fields (description, status) are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *',
      [description, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /tasks/:id - Update a task's status
app.put('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, taskId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});