const router = require('express').Router();
const { q }  = require('../db');
const { authMiddleware } = require('../middleware/auth.middleware');

const safe = u => { const { password_hash, ...r } = u; return r; };

router.get('/:username', async (req, res) => {
  try {
    const ur = await q('SELECT * FROM users WHERE username=$1', [req.params.username]);
    if (!ur.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
    const pages = await q('SELECT id,nombre,slug,thumbnail,is_public,created_at FROM pages WHERE user_id=$1 ORDER BY updated_at DESC', [ur.rows[0].id]);
    const projs = await q('SELECT id,nombre,descripcion,thumbnail,estado,created_at FROM projects WHERE user_id=$1 ORDER BY updated_at DESC', [ur.rows[0].id]);
    return res.json({ user: safe(ur.rows[0]), pages: pages.rows, projects: projs.rows });
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const { bio, location, avatar } = req.body;
    const r = await q('UPDATE users SET bio=COALESCE($1,bio),location=COALESCE($2,location),avatar=COALESCE($3,avatar) WHERE id=$4 RETURNING *',
      [bio??null, location??null, avatar??null, req.user.id]);
    return res.json(safe(r.rows[0]));
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

router.put('/banner', authMiddleware, async (req, res) => {
  try {
    const { banner_img, banner_grad } = req.body;
    await q('UPDATE users SET banner_img=COALESCE($1,banner_img),banner_grad=COALESCE($2,banner_grad) WHERE id=$3',
      [banner_img??null, banner_grad??null, req.user.id]);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

module.exports = router;
