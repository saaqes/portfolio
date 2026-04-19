const express  = require('express');
const router   = express.Router();
const { query } = require('../db');
const { adminMiddleware } = require('../middleware/auth.middleware');

router.use(adminMiddleware);

function safe(u) { const { password_hash, ...r } = u; return r; }

router.get('/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.role, u.created_at,
             COUNT(p.id)::int as page_count
      FROM users u
      LEFT JOIN user_pages p ON p.user_id = u.id
      GROUP BY u.id ORDER BY u.created_at DESC
    `);
    return res.json(result.rows);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
    const check = await query('SELECT role FROM users WHERE id=$1', [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (check.rows[0].role === 'admin') return res.status(403).json({ error: 'No se puede eliminar otro admin.' });
    await query('DELETE FROM users WHERE id=$1', [req.params.id]); // cascade borra user_pages
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM site_settings');
    const s = {}; result.rows.forEach(r => s[r.key] = r.value);
    return res.json(s);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.put('/settings', async (req, res) => {
  try {
    const allowed = ['hero_title','hero_subtitle','hero_cta','primary_color','accent_color'];
    for (const [k, v] of Object.entries(req.body)) {
      if (allowed.includes(k)) {
        await query(
          'INSERT INTO site_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()',
          [k, v]
        );
      }
    }
    const result = await query('SELECT key,value FROM site_settings');
    const s = {}; result.rows.forEach(r => s[r.key] = r.value);
    return res.json(s);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.put('/profile', async (req, res) => {
  try {
    const { bio, location, avatar, banner_img, banner_grad, btn_text, btn_link, btn_color, btn_style } = req.body;
    const result = await query(
      `UPDATE users SET
        bio=COALESCE($1,bio), location=COALESCE($2,location), avatar=COALESCE($3,avatar),
        banner_img=COALESCE($4,banner_img), banner_grad=COALESCE($5,banner_grad),
        btn_text=COALESCE($6,btn_text), btn_link=COALESCE($7,btn_link),
        btn_color=COALESCE($8,btn_color), btn_style=COALESCE($9,btn_style)
       WHERE id=$10 RETURNING *`,
      [bio??null, location??null, avatar??null, banner_img??null, banner_grad??null,
       btn_text??null, btn_link??null, btn_color??null, btn_style??null, req.user.id]
    );
    return res.json(safe(result.rows[0]));
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.get('/messages', async (req, res) => {
  try {
    const result = await query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return res.json(result.rows);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.put('/messages/:id/read', async (req, res) => {
  try {
    await query('UPDATE contact_messages SET read=TRUE WHERE id=$1', [req.params.id]);
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    await query('DELETE FROM contact_messages WHERE id=$1', [req.params.id]);
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.get('/stats', async (req, res) => {
  try {
    const [users, pages, projects, msgs] = await Promise.all([
      query("SELECT COUNT(*)::int as cnt FROM users WHERE role!='admin'"),
      query('SELECT COUNT(*)::int as cnt FROM user_pages'),
      query('SELECT COUNT(*)::int as cnt FROM projects'),
      query('SELECT COUNT(*)::int as cnt FROM contact_messages WHERE read=FALSE'),
    ]);
    return res.json({
      userCount:       users.rows[0].cnt,
      pageCount:       pages.rows[0].cnt,
      projectCount:    projects.rows[0].cnt,
      unreadMessages:  msgs.rows[0].cnt,
    });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

module.exports = router;
