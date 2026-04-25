const router = require('express').Router();
const { q }  = require('../db');
const { authMiddleware } = require('../middleware/auth.middleware');

// GET /api/pages
router.get('/', authMiddleware, async (req, res) => {
  try {
    const r = await q('SELECT id,nombre,slug,thumbnail,is_public,created_at,updated_at FROM pages WHERE user_id=$1 ORDER BY updated_at DESC', [req.user.id]);
    return res.json(r.rows);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/pages/:id — cargar datos del builder
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await q('SELECT * FROM pages WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
    return res.json(r.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// POST /api/pages — crear página
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, site_data, thumbnail } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido.' });
    const slug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const r = await q(
      'INSERT INTO pages(user_id,nombre,slug,site_data,thumbnail) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, nombre, slug, JSON.stringify(site_data||{}), thumbnail||'']
    );
    return res.status(201).json(r.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// PUT /api/pages/:id — guardar estado del builder
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, site_data, thumbnail, is_public } = req.body;
    const r = await q(
      `UPDATE pages SET
        nombre=COALESCE($1,nombre), site_data=COALESCE($2,site_data),
        thumbnail=COALESCE($3,thumbnail), is_public=COALESCE($4,is_public),
        updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [nombre||null, site_data?JSON.stringify(site_data):null, thumbnail||null,
       is_public!==undefined?is_public:null, req.params.id, req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
    return res.json(r.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// DELETE /api/pages/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const check = await q('SELECT id FROM pages WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
    await q('DELETE FROM pages WHERE id=$1', [req.params.id]);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

module.exports = router;
