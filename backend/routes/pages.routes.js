const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth.middleware');

function parsePage(p) { try { p.page_data = JSON.parse(p.page_data); } catch { p.page_data = {}; } return p; }

router.get('/', authMiddleware, (req, res) => {
  const { all } = getDb();
  const pages = all('SELECT id,user_id,page_name,page_slug,thumbnail,created_at,updated_at FROM user_pages WHERE user_id=? ORDER BY updated_at DESC', [req.user.id]);
  return res.json(pages);
});

router.get('/view/:username/:slug', (req, res) => {
  const { get } = getDb();
  const user = get('SELECT id FROM users WHERE username=?', [req.params.username]);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const page = get('SELECT * FROM user_pages WHERE user_id=? AND page_slug=?', [user.id, req.params.slug]);
  if (!page) return res.status(404).json({ error: 'Página no encontrada' });
  return res.json(parsePage(page));
});

router.post('/', authMiddleware, (req, res) => {
  const { page_name, page_slug, page_data, thumbnail } = req.body;
  if (!page_name || !page_slug) return res.status(400).json({ error: 'Nombre y slug requeridos' });
  const slug = page_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const { get, run } = getDb();
  if (get('SELECT id FROM user_pages WHERE user_id=? AND page_slug=?', [req.user.id, slug]))
    return res.status(409).json({ error: 'Ya tienes una página con ese slug.' });
  const r = run('INSERT INTO user_pages (user_id,page_name,page_slug,page_data,thumbnail) VALUES (?,?,?,?,?)',
    [req.user.id, page_name, slug, JSON.stringify(page_data||{}), thumbnail||'']);
  const page = parsePage(get('SELECT * FROM user_pages WHERE id=?', [r.lastInsertRowid]));
  return res.status(201).json(page);
});

router.put('/:id', authMiddleware, (req, res) => {
  const { page_name, page_slug, page_data, thumbnail } = req.body;
  const { get, run } = getDb();
  const page = get('SELECT * FROM user_pages WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!page) return res.status(404).json({ error: 'Página no encontrada' });
  const slug = page_slug ? page_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') : page.page_slug;
  run(`UPDATE user_pages SET page_name=COALESCE(?,page_name), page_slug=?,
    page_data=COALESCE(?,page_data), thumbnail=COALESCE(?,thumbnail),
    updated_at=datetime('now') WHERE id=? AND user_id=?`,
    [page_name||null, slug, page_data?JSON.stringify(page_data):null, thumbnail||null, req.params.id, req.user.id]);
  return res.json(parsePage(get('SELECT * FROM user_pages WHERE id=?', [req.params.id])));
});

router.delete('/:id', authMiddleware, (req, res) => {
  const { get, run } = getDb();
  if (!get('SELECT id FROM user_pages WHERE id=? AND user_id=?', [req.params.id, req.user.id]))
    return res.status(404).json({ error: 'Página no encontrada o no autorizado' });
  run('DELETE FROM user_pages WHERE id=?', [req.params.id]);
  return res.json({ ok: true });
});

module.exports = router;
