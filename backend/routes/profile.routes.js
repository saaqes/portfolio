const express  = require('express');
const router   = express.Router();
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth.middleware');

function safe(u) { if (!u) return null; const { password_hash, ...r } = u; return r; }

router.get('/:username', async (req, res) => {
  try {
    const userRes = await query('SELECT * FROM users WHERE username=$1', [req.params.username]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    const pagesRes = await query(
      'SELECT id,page_name,page_slug,thumbnail,created_at FROM user_pages WHERE user_id=$1 ORDER BY updated_at DESC',
      [userRes.rows[0].id]
    );
    return res.json({ user: safe(userRes.rows[0]), pages: pagesRes.rows });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const { bio, location, avatar } = req.body;
    const result = await query(
      'UPDATE users SET bio=COALESCE($1,bio), location=COALESCE($2,location), avatar=COALESCE($3,avatar) WHERE id=$4 RETURNING *',
      [bio??null, location??null, avatar??null, req.user.id]
    );
    return res.json(safe(result.rows[0]));
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.put('/banner/update', authMiddleware, async (req, res) => {
  try {
    const { banner_img, banner_grad } = req.body;
    await query('UPDATE users SET banner_img=$1, banner_grad=$2 WHERE id=$3', [banner_img||'', banner_grad||'', req.user.id]);
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

module.exports = router;
