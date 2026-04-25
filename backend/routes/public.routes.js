const router = require('express').Router();
const { q }  = require('../db');

// GET /api/public/stats
router.get('/stats', async (req, res) => {
  try {
    const r = await q('SELECT * FROM stats ORDER BY id DESC LIMIT 1');
    return res.json(r.rows[0] || {});
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/public/skills
router.get('/skills', async (req, res) => {
  try {
    const r = await q('SELECT * FROM skills ORDER BY orden ASC');
    return res.json(r.rows);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/public/trajectory
router.get('/trajectory', async (req, res) => {
  try {
    const r = await q('SELECT * FROM trajectory ORDER BY orden ASC');
    return res.json(r.rows);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/public/testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const r = await q('SELECT * FROM testimonials ORDER BY orden ASC');
    return res.json(r.rows);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/public/contact
router.get('/contact', async (req, res) => {
  try {
    const r = await q('SELECT * FROM contact LIMIT 1');
    return res.json(r.rows[0] || {});
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/public/settings
router.get('/settings', async (req, res) => {
  try {
    const r = await q('SELECT key, value FROM site_settings');
    const s = {}; r.rows.forEach(row => s[row.key] = row.value);
    return res.json(s);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// POST /api/public/contact-message
router.post('/contact-message', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Campos requeridos.' });
    await q('INSERT INTO contact_messages(name,email,message) VALUES($1,$2,$3)', [name, email, message]);
    await q("INSERT INTO notifications(tipo,titulo,descripcion) VALUES('mensaje',$1,$2)",
      [`Mensaje de ${name}`, email]);
    return res.status(201).json({ ok: true, message: '¡Mensaje enviado!' });
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/public/projects (proyectos aprobados, para el portfolio público)
router.get('/projects', async (req, res) => {
  try {
    const r = await q(`
      SELECT p.id, p.nombre, p.descripcion, p.thumbnail, p.tags, p.preview_url, p.created_at,
             u.username, u.avatar
      FROM projects p JOIN users u ON u.id = p.user_id
      WHERE p.estado = 'aprobado'
      ORDER BY p.updated_at DESC
    `);
    return res.json(r.rows);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/public/pages/:username/:slug — ver página pública
router.get('/pages/:username/:slug', async (req, res) => {
  try {
    const userR = await q('SELECT id FROM users WHERE username=$1', [req.params.username]);
    if (!userR.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const pageR = await q('SELECT * FROM pages WHERE user_id=$1 AND slug=$2 AND is_public=TRUE',
      [userR.rows[0].id, req.params.slug]);
    if (!pageR.rows[0]) return res.status(404).json({ error: 'Página no encontrada' });
    return res.json(pageR.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

module.exports = router;
