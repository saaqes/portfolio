const express  = require('express');
const router   = express.Router();
const { query } = require('../db');

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email inválido.' });
    await query('INSERT INTO contact_messages (name,email,message) VALUES ($1,$2,$3)', [name, email, message]);
    return res.status(201).json({ ok: true, message: '¡Mensaje enviado con éxito!' });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

// Configuración pública del sitio
router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT key,value FROM site_settings');
    const s = {}; result.rows.forEach(r => s[r.key] = r.value);
    return res.json(s);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

// Stats públicas (para el hero counter)
router.get('/stats', async (req, res) => {
  try {
    const [projects, users, pages] = await Promise.all([
      query('SELECT COUNT(*)::int as cnt FROM projects'),
      query("SELECT COUNT(*)::int as cnt FROM users WHERE role!='admin'"),
      query('SELECT COUNT(*)::int as cnt FROM user_pages'),
    ]);
    return res.json({
      projectCount: projects.rows[0].cnt,
      userCount:    users.rows[0].cnt,
      pageCount:    pages.rows[0].cnt,
      years: 3
    });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

module.exports = router;
