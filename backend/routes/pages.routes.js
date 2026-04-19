const express  = require('express');
const router   = express.Router();
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id,user_id,page_name,page_slug,thumbnail,created_at,updated_at FROM user_pages WHERE user_id=$1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.get('/view/:username/:slug', async (req, res) => {
  try {
    const userRes = await query('SELECT id FROM users WHERE username=$1', [req.params.username]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const pageRes = await query(
      'SELECT * FROM user_pages WHERE user_id=$1 AND page_slug=$2',
      [userRes.rows[0].id, req.params.slug]
    );
    if (!pageRes.rows[0]) return res.status(404).json({ error: 'Página no encontrada' });
    return res.json(pageRes.rows[0]);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { page_name, page_slug, page_data, thumbnail } = req.body;
    if (!page_name || !page_slug) return res.status(400).json({ error: 'Nombre y slug requeridos' });
    const slug = page_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const existing = await query('SELECT id FROM user_pages WHERE user_id=$1 AND page_slug=$2', [req.user.id, slug]);
    if (existing.rows.length) return res.status(409).json({ error: 'Ya tienes una página con ese slug.' });

    const result = await query(
      'INSERT INTO user_pages (user_id,page_name,page_slug,page_data,thumbnail) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, page_name, slug, JSON.stringify(page_data||{}), thumbnail||'']
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { page_name, page_slug, page_data, thumbnail } = req.body;
    const pageRes = await query('SELECT * FROM user_pages WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!pageRes.rows[0]) return res.status(404).json({ error: 'Página no encontrada' });

    const slug = page_slug
      ? page_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : pageRes.rows[0].page_slug;

    const result = await query(
      `UPDATE user_pages SET
        page_name=COALESCE($1,page_name), page_slug=$2,
        page_data=COALESCE($3,page_data), thumbnail=COALESCE($4,thumbnail),
        updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [page_name||null, slug, page_data?JSON.stringify(page_data):null, thumbnail||null, req.params.id, req.user.id]
    );
    return res.json(result.rows[0]);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const check = await query('SELECT id FROM user_pages WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Página no encontrada o no autorizado' });
    await query('DELETE FROM user_pages WHERE id=$1', [req.params.id]);
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

module.exports = router;
