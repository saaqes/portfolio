const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.post('/', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email inválido.' });
  const { run } = getDb();
  run('INSERT INTO contact_messages (name,email,message) VALUES (?,?,?)', [name, email, message]);
  return res.status(201).json({ ok: true, message: '¡Mensaje enviado con éxito!' });
});

router.get('/settings', (req, res) => {
  const { all } = getDb();
  const rows = all('SELECT key,value FROM site_settings');
  const s = {}; rows.forEach(r => s[r.key] = r.value);
  return res.json(s);
});

module.exports = router;

// GET /api/contact/stats — estadísticas públicas del sitio
router.get('/stats', (req, res) => {
  const { all } = getDb();
  const q = (sql) => Number(all(sql)[0]?.cnt || 0);
  return res.json({
    projectCount: q('SELECT COUNT(*) as cnt FROM projects'),
    userCount:    q("SELECT COUNT(*) as cnt FROM users WHERE role!='admin'"),
    pageCount:    q('SELECT COUNT(*) as cnt FROM user_pages'),
    years: 3
  });
});
