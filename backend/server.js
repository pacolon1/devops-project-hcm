const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// BUG #1: Wrong default password - doesn't match docker-compose!
const pool = new Pool({
   user: process.env.DB_USER || 'postgres',
   // host: process.env.DB_HOST || 'localhost',
   host: process.env.DB_HOST || 'host.docker.internal', // Use this address for Docker to connect to host's PostgreSQL
   database: process.env.DB_NAME || 'tododb',
   password: process.env.DB_PASSWORD || 'postgres',
   port: process.env.DB_PORT || 5432,
});

app.get('/health', (req, res) => {
   res.json({ status: 'healthy', version: '1.0.0' });
});

// GET todos
app.get('/api/todos', async (req, res) => {
   console.log('Received GET /api/todos request');
   try {
      const result = await pool.query('SELECT * FROM todos ORDER BY id');
      res.json(result.rows);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// POST todos
app.post('/api/todos', async (req, res) => {
   try {
      const { title, completed = false } = req.body;

      if (!title || title.trim() === '') {
         return res.status(400).json({ error: 'Title is required' });
      }

      const result = await pool.query(
         'INSERT INTO todos(title, completed) VALUES($1, $2) RETURNING *',
         [title, completed]
      );
      res.status(201).json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// DELETE todos (Đã khớp với frontend deleteTodo)
app.delete('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;

      const result = await pool.query(
         'DELETE FROM todos WHERE id = $1 RETURNING *',
         [id]
      );

      if (result.rows.length === 0) {
         return res.status(404).json({ error: 'Todo not found' });
      }

      res.json({ message: 'Deleted successfully' });
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// PUT todos - ĐÃ SỬA ĐỂ KHỚP VỚI FRONTEND (Hỗ trợ cập nhật từng phần)
app.put('/api/todos/:id', async (req, res) => {
   try {
      const { id } = req.params;
      const { title, completed } = req.body;

      // 1. Lấy thông tin todo cũ ra trước
      const checkExist = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
      if (checkExist.rows.length === 0) {
         return res.status(404).json({ error: 'Todo not found' });
      }

      const currentTodo = checkExist.rows[0];

      // 2. Lấy giá trị mới, nếu không gửi lên thì giữ nguyên giá trị cũ (đáp ứng frontend)
      const updatedTitle = title !== undefined ? title : currentTodo.title;
      const updatedCompleted = completed !== undefined ? completed : currentTodo.completed;

      // 3. Chỉ báo lỗi nếu cố tình gửi title rỗng
      if (title !== undefined && title.trim() === '') {
         return res.status(400).json({ error: 'Title cannot be empty' });
      }

      const result = await pool.query(
         'UPDATE todos SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
         [updatedTitle, updatedCompleted, id]
      );

      res.json(result.rows[0]);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

const port = process.env.PORT || 8080;

// BUG #5 & DB CONNECTION FIX: Chỉ chạy server và connect DB khi không phải môi trường test
if (process.env.NODE_ENV !== 'test') {
   pool.connect()
      .then(client => {
         console.log('Connected to PostgreSQL database successfully!');
         client.release();
         
         app.listen(port, () => {
            console.log(`Backend running on port ${port}`);
         });
      })
      .catch(err => {
         console.error('Failed to connect to PostgreSQL database:', err.message);
         process.exit(1); // Exit with failure code
      });
}

// BUG #6: Export cả app VÀ pool để file test có thể import và đóng kết nối (pool.end)
module.exports = { app, pool };