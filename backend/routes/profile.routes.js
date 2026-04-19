const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth.middleware');

function safe(u) { if (!u) return null; const { password_hash, ...r } = u; return r; }

router.get('/:username', (req, res) => {
  const { get, all } = getDb();
  const user = get('SELECT * FROM users WHERE username=?', [req.params.username]);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const pages = all('SELECT id,page_name,page_slug,thumbnail,created_at FROM user_pages WHERE user_id=? ORDER BY updated_at DESC', [user.id]);
  return res.json({ user: safe(user), pages });
});

router.put('/', authMiddleware, (req, res) => {
  const { bio, location, avatar } = req.body;
  const { run, get } = getDb();
  run(`UPDATE users SET bio=COALESCE(?,bio), location=COALESCE(?,location), avatar=COALESCE(?,avatar) WHERE id=?`,
    [bio??null, location??null, avatar??null, req.user.id]);
  return res.json(safe(get('SELECT * FROM users WHERE id=?', [req.user.id])));
});

router.put('/banner/update', authMiddleware, (req, res) => {
  const { banner_img, banner_grad } = req.body;
  const { run } = getDb();
  run('UPDATE users SET banner_img=?, banner_grad=? WHERE id=?', [banner_img||'', banner_grad||'', req.user.id]);
  return res.json({ ok: true });
});

module.exports = router;
