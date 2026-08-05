require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ----- Database connection (uses Railway's env variables) -----
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

// Create the table we need if it doesn't already exist
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      store_key VARCHAR(255) NOT NULL,
      shared BOOLEAN NOT NULL,
      value LONGTEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (store_key, shared)
    )
  `);
  console.log('Database ready.');
}
initDb().catch(err => console.error('DB init failed:', err));

// ----- API endpoints (mimic the get/set/delete/list storage API) -----
app.get('/api/storage/:key', async (req, res) => {
  const shared = req.query.shared === 'true';
  const [rows] = await pool.query(
    'SELECT value FROM kv_store WHERE store_key=? AND shared=?',
    [req.params.key, shared]
  );
  if (rows.length === 0) return res.json(null);
  res.json({ key: req.params.key, value: rows[0].value, shared });
});

app.post('/api/storage', async (req, res) => {
  const { key, value, shared } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  await pool.query(
    'INSERT INTO kv_store (store_key, shared, value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=?',
    [key, !!shared, value, value]
  );
  res.json({ key, value, shared: !!shared });
});

app.delete('/api/storage/:key', async (req, res) => {
  const shared = req.query.shared === 'true';
  await pool.query('DELETE FROM kv_store WHERE store_key=? AND shared=?', [req.params.key, shared]);
  res.json({ key: req.params.key, deleted: true, shared });
});

app.get('/api/storage-list', async (req, res) => {
  const shared = req.query.shared === 'true';
  const prefix = req.query.prefix || '';
  const [rows] = await pool.query(
    'SELECT store_key FROM kv_store WHERE shared=? AND store_key LIKE ?',
    [shared, prefix + '%']
  );
  res.json({ keys: rows.map(r => r.store_key), prefix, shared });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});