const router = require('express').Router();
const { q }  = require('../db');
const { adminMiddleware } = require('../middleware/auth.middleware');

router.use(adminMiddleware);

const safe = u => { const { password_hash, ...r } = u; return r; };

// ── STATS ──
router.get('/stats', async (req, res) => {
  try {
    const [st, users, pages, projs, msgs, notifs] = await Promise.all([
      q('SELECT * FROM stats LIMIT 1'),
      q("SELECT COUNT(*)::int as cnt FROM users WHERE role!='admin'"),
      q('SELECT COUNT(*)::int as cnt FROM pages'),
      q('SELECT COUNT(*)::int as cnt FROM projects'),
      q('SELECT COUNT(*)::int as cnt FROM contact_messages WHERE read=FALSE'),
      q('SELECT COUNT(*)::int as cnt FROM notifications WHERE leido=FALSE'),
    ]);
    return res.json({ ...st.rows[0], real_users: users.rows[0].cnt, real_pages: pages.rows[0].cnt, real_projects: projs.rows[0].cnt, unread_messages: msgs.rows[0].cnt, unread_notifications: notifs.rows[0].cnt });
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

router.put('/stats', async (req, res) => {
  try {
    const { proyectos_creados, usuarios_activos, paginas_publicadas, anos_experiencia } = req.body;
    await q(`UPDATE stats SET proyectos_creados=COALESCE($1,proyectos_creados),
      usuarios_activos=COALESCE($2,usuarios_activos), paginas_publicadas=COALESCE($3,paginas_publicadas),
      anos_experiencia=COALESCE($4,anos_experiencia), updated_at=NOW() WHERE id=1`,
      [proyectos_creados??null, usuarios_activos??null, paginas_publicadas??null, anos_experiencia??null]);
    const r = await q('SELECT * FROM stats LIMIT 1');
    return res.json(r.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// ── SKILLS ──
router.get('/skills', async (req, res) => { const r = await q('SELECT * FROM skills ORDER BY orden'); return res.json(r.rows); });
router.post('/skills', async (req, res) => {
  const { nombre, nivel, icono } = req.body;
  const maxO = await q('SELECT MAX(orden) as m FROM skills');
  const r = await q('INSERT INTO skills(nombre,nivel,icono,orden) VALUES($1,$2,$3,$4) RETURNING *', [nombre, nivel||80, icono||'⚡', (maxO.rows[0].m||0)+1]);
  return res.status(201).json(r.rows[0]);
});
router.put('/skills/:id', async (req, res) => {
  const { nombre, nivel, icono, orden } = req.body;
  const r = await q('UPDATE skills SET nombre=COALESCE($1,nombre),nivel=COALESCE($2,nivel),icono=COALESCE($3,icono),orden=COALESCE($4,orden) WHERE id=$5 RETURNING *',
    [nombre||null, nivel??null, icono||null, orden??null, req.params.id]);
  return res.json(r.rows[0]);
});
router.delete('/skills/:id', async (req, res) => { await q('DELETE FROM skills WHERE id=$1', [req.params.id]); return res.json({ ok: true }); });

// ── TRAJECTORY ──
router.get('/trajectory', async (req, res) => { const r = await q('SELECT * FROM trajectory ORDER BY orden'); return res.json(r.rows); });
router.post('/trajectory', async (req, res) => {
  const { titulo, empresa, fecha, descripcion } = req.body;
  const maxO = await q('SELECT MAX(orden) as m FROM trajectory');
  const r = await q('INSERT INTO trajectory(titulo,empresa,fecha,descripcion,orden) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [titulo, empresa||'', fecha||'', descripcion||'', (maxO.rows[0].m||0)+1]);
  return res.status(201).json(r.rows[0]);
});
router.put('/trajectory/:id', async (req, res) => {
  const { titulo, empresa, fecha, descripcion, orden } = req.body;
  const r = await q('UPDATE trajectory SET titulo=COALESCE($1,titulo),empresa=COALESCE($2,empresa),fecha=COALESCE($3,fecha),descripcion=COALESCE($4,descripcion),orden=COALESCE($5,orden) WHERE id=$6 RETURNING *',
    [titulo||null, empresa||null, fecha||null, descripcion||null, orden??null, req.params.id]);
  return res.json(r.rows[0]);
});
router.delete('/trajectory/:id', async (req, res) => { await q('DELETE FROM trajectory WHERE id=$1', [req.params.id]); return res.json({ ok: true }); });

// ── TESTIMONIALS ──
router.get('/testimonials', async (req, res) => { const r = await q('SELECT * FROM testimonials ORDER BY orden'); return res.json(r.rows); });
router.post('/testimonials', async (req, res) => {
  const { nombre, rol, comentario, imagen } = req.body;
  const maxO = await q('SELECT MAX(orden) as m FROM testimonials');
  const r = await q('INSERT INTO testimonials(nombre,rol,comentario,imagen,orden) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [nombre, rol||'', comentario, imagen||'', (maxO.rows[0].m||0)+1]);
  return res.status(201).json(r.rows[0]);
});
router.put('/testimonials/:id', async (req, res) => {
  const { nombre, rol, comentario, imagen, orden } = req.body;
  const r = await q('UPDATE testimonials SET nombre=COALESCE($1,nombre),rol=COALESCE($2,rol),comentario=COALESCE($3,comentario),imagen=COALESCE($4,imagen),orden=COALESCE($5,orden) WHERE id=$6 RETURNING *',
    [nombre||null, rol||null, comentario||null, imagen||null, orden??null, req.params.id]);
  return res.json(r.rows[0]);
});
router.delete('/testimonials/:id', async (req, res) => { await q('DELETE FROM testimonials WHERE id=$1', [req.params.id]); return res.json({ ok: true }); });

// ── CONTACT INFO ──
router.put('/contact', async (req, res) => {
  const { email, telefono, instagram, behance, linkedin, github, direccion } = req.body;
  await q('UPDATE contact SET email=COALESCE($1,email),telefono=COALESCE($2,telefono),instagram=COALESCE($3,instagram),behance=COALESCE($4,behance),linkedin=COALESCE($5,linkedin),github=COALESCE($6,github),direccion=COALESCE($7,direccion) WHERE id=1',
    [email||null, telefono||null, instagram||null, behance||null, linkedin||null, github||null, direccion||null]);
  const r = await q('SELECT * FROM contact LIMIT 1');
  return res.json(r.rows[0]);
});

// ── SITE SETTINGS ──
router.get('/settings', async (req, res) => {
  const r = await q('SELECT key,value FROM site_settings');
  const s = {}; r.rows.forEach(row => s[row.key] = row.value);
  return res.json(s);
});
router.put('/settings', async (req, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    await q('INSERT INTO site_settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=$2,updated_at=NOW()', [k, v]);
  }
  const r = await q('SELECT key,value FROM site_settings');
  const s = {}; r.rows.forEach(row => s[row.key] = row.value);
  return res.json(s);
});

// ── ADMIN PROFILE ──
router.put('/profile', async (req, res) => {
  const { bio, location, avatar, banner_img, banner_grad, btn_text, btn_link, btn_color, btn_style } = req.body;
  const r = await q(`UPDATE users SET bio=COALESCE($1,bio),location=COALESCE($2,location),avatar=COALESCE($3,avatar),banner_img=COALESCE($4,banner_img),banner_grad=COALESCE($5,banner_grad),btn_text=COALESCE($6,btn_text),btn_link=COALESCE($7,btn_link),btn_color=COALESCE($8,btn_color),btn_style=COALESCE($9,btn_style) WHERE id=$10 RETURNING *`,
    [bio??null,location??null,avatar??null,banner_img??null,banner_grad??null,btn_text??null,btn_link??null,btn_color??null,btn_style??null, req.user.id]);
  return res.json(safe(r.rows[0]));
});

// ── USERS ──
router.get('/users', async (req, res) => {
  const r = await q(`SELECT u.id,u.username,u.email,u.role,u.created_at,
    COUNT(DISTINCT p.id)::int as page_count, COUNT(DISTINCT pr.id)::int as project_count
    FROM users u LEFT JOIN pages p ON p.user_id=u.id LEFT JOIN projects pr ON pr.user_id=u.id
    GROUP BY u.id ORDER BY u.created_at DESC`);
  return res.json(r.rows);
});
router.delete('/users/:id', async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });
  const check = await q('SELECT role FROM users WHERE id=$1', [req.params.id]);
  if (!check.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
  if (check.rows[0].role === 'admin') return res.status(403).json({ error: 'No se puede eliminar admin.' });
  await q('DELETE FROM users WHERE id=$1', [req.params.id]);
  return res.json({ ok: true });
});

// ── PROJECTS (revisión) ──
router.get('/projects', async (req, res) => {
  const { estado } = req.query;
  let sql = `SELECT pr.*,u.username,u.email,u.avatar FROM projects pr JOIN users u ON u.id=pr.user_id`;
  const params = [];
  if (estado) { sql += ' WHERE pr.estado=$1'; params.push(estado); }
  sql += ' ORDER BY pr.updated_at DESC';
  const r = await q(sql, params);
  return res.json(r.rows);
});

router.put('/projects/:id/review', async (req, res) => {
  const { estado, feedback_admin } = req.body; // estado: 'aprobado' | 'rechazado'
  if (!['aprobado','rechazado'].includes(estado)) return res.status(400).json({ error: 'Estado inválido.' });
  const r = await q("UPDATE projects SET estado=$1,feedback_admin=COALESCE($2,feedback_admin),updated_at=NOW() WHERE id=$3 RETURNING *",
    [estado, feedback_admin||null, req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
  // Notificación al usuario (en producción podrías agregar email)
  await q("INSERT INTO notifications(tipo,titulo,descripcion,referencia_id) VALUES($1,$2,$3,$4)",
    ['revision', `Proyecto ${estado}: ${r.rows[0].nombre}`, feedback_admin||`Tu proyecto fue ${estado}.`, parseInt(req.params.id)]);
  return res.json(r.rows[0]);
});

// ── MESSAGES ──
router.get('/messages', async (req, res) => {
  const r = await q('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return res.json(r.rows);
});
router.put('/messages/:id/read', async (req, res) => {
  await q('UPDATE contact_messages SET read=TRUE WHERE id=$1', [req.params.id]);
  return res.json({ ok: true });
});
router.delete('/messages/:id', async (req, res) => {
  await q('DELETE FROM contact_messages WHERE id=$1', [req.params.id]);
  return res.json({ ok: true });
});

// ── NOTIFICATIONS ──
router.get('/notifications', async (req, res) => {
  const r = await q('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
  return res.json(r.rows);
});
router.put('/notifications/:id/read', async (req, res) => {
  await q('UPDATE notifications SET leido=TRUE WHERE id=$1', [req.params.id]);
  return res.json({ ok: true });
});
router.put('/notifications/read-all', async (req, res) => {
  await q('UPDATE notifications SET leido=TRUE');
  return res.json({ ok: true });
});

module.exports = router;
