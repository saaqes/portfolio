const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { adminMiddleware } = require('../middleware/auth.middleware');

router.use(adminMiddleware);

function safe(u) { const { password_hash, ...r } = u; return r; }

router.get('/users', (req, res) => {
  const { all } = getDb();
  const users = all(`SELECT u.id,u.username,u.email,u.role,u.created_at,
    COUNT(p.id) as page_count FROM users u
    LEFT JOIN user_pages p ON p.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC`);
  return res.json(users);
});

router.delete('/users/:id', (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
  const { get, run } = getDb();
  const user = get('SELECT * FROM users WHERE id=?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.role === 'admin') return res.status(403).json({ error: 'No se puede eliminar otro admin.' });
  run('DELETE FROM user_pages WHERE user_id=?', [req.params.id]);
  run('DELETE FROM users WHERE id=?', [req.params.id]);
  return res.json({ ok: true });
});

router.get('/settings', (req, res) => {
  const { all } = getDb();
  const rows = all('SELECT key, value FROM site_settings');
  const s = {}; rows.forEach(r => s[r.key] = r.value);
  return res.json(s);
});

router.put('/settings', (req, res) => {
  const { run, all } = getDb();
  const allowed = ['hero_title','hero_subtitle','hero_cta','primary_color','accent_color'];
  Object.entries(req.body).forEach(([k, v]) => {
    if (allowed.includes(k))
      run(`INSERT INTO site_settings (key,value,updated_at) VALUES (?,?,datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`, [k, v]);
  });
  const rows = all('SELECT key,value FROM site_settings');
  const s = {}; rows.forEach(r => s[r.key] = r.value);
  return res.json(s);
});

router.put('/profile', (req, res) => {
  const { bio, location, avatar, banner_img, banner_grad, btn_text, btn_link, btn_color, btn_style } = req.body;
  const { run, get } = getDb();
  run(`UPDATE users SET
    bio=COALESCE(?,bio), location=COALESCE(?,location), avatar=COALESCE(?,avatar),
    banner_img=COALESCE(?,banner_img), banner_grad=COALESCE(?,banner_grad),
    btn_text=COALESCE(?,btn_text), btn_link=COALESCE(?,btn_link),
    btn_color=COALESCE(?,btn_color), btn_style=COALESCE(?,btn_style) WHERE id=?`,
    [bio??null,location??null,avatar??null,banner_img??null,banner_grad??null,
     btn_text??null,btn_link??null,btn_color??null,btn_style??null, req.user.id]);
  return res.json(safe(get('SELECT * FROM users WHERE id=?', [req.user.id])));
});

router.get('/messages', (req, res) => {
  const { all } = getDb();
  return res.json(all('SELECT * FROM contact_messages ORDER BY created_at DESC'));
});

router.put('/messages/:id/read', (req, res) => {
  const { run } = getDb();
  run('UPDATE contact_messages SET read=1 WHERE id=?', [req.params.id]);
  return res.json({ ok: true });
});

router.delete('/messages/:id', (req, res) => {
  const { run } = getDb();
  run('DELETE FROM contact_messages WHERE id=?', [req.params.id]);
  return res.json({ ok: true });
});

router.get('/stats', (req, res) => {
  const { all } = getDb();
  const q = (sql) => Number(all(sql)[0]?.cnt || 0);
  return res.json({
    userCount: q("SELECT COUNT(*) as cnt FROM users WHERE role!='admin'"),
    pageCount: q('SELECT COUNT(*) as cnt FROM user_pages'),
    projectCount: q('SELECT COUNT(*) as cnt FROM projects'),
    unreadMessages: q('SELECT COUNT(*) as cnt FROM contact_messages WHERE read=0')
  });
});

module.exports = router;
