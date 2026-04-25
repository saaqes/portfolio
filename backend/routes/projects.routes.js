const router = require('express').Router();
const { q }  = require('../db');
const { authMiddleware } = require('../middleware/auth.middleware');

// GET /api/projects — mis proyectos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const r = await q('SELECT * FROM projects WHERE user_id=$1 ORDER BY updated_at DESC', [req.user.id]);
    return res.json(r.rows);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// GET /api/projects/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await q('SELECT * FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
    return res.json(r.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// POST /api/projects — crear proyecto
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, descripcion, contenido_html, contenido_css, contenido_js, thumbnail, tags, preview_url } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido.' });
    const r = await q(
      `INSERT INTO projects(user_id,nombre,descripcion,contenido_html,contenido_css,contenido_js,thumbnail,tags,preview_url)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, nombre, descripcion||'', contenido_html||'', contenido_css||'', contenido_js||'',
       thumbnail||'', JSON.stringify(tags||[]), preview_url||'']
    );
    return res.status(201).json(r.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// PUT /api/projects/:id — actualizar proyecto
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nombre, descripcion, contenido_html, contenido_css, contenido_js, thumbnail, tags, preview_url } = req.body;
    const r = await q(
      `UPDATE projects SET
        nombre=COALESCE($1,nombre), descripcion=COALESCE($2,descripcion),
        contenido_html=COALESCE($3,contenido_html), contenido_css=COALESCE($4,contenido_css),
        contenido_js=COALESCE($5,contenido_js), thumbnail=COALESCE($6,thumbnail),
        tags=COALESCE($7,tags), preview_url=COALESCE($8,preview_url),
        updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [nombre||null, descripcion||null, contenido_html||null, contenido_css||null,
       contenido_js||null, thumbnail||null, tags?JSON.stringify(tags):null,
       preview_url||null, req.params.id, req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
    return res.json(r.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// POST /api/projects/:id/submit — enviar para revisión
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { mensaje_usuario } = req.body;
    const check = await q('SELECT * FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'No encontrado.' });

    const r = await q(
      "UPDATE projects SET estado='enviado', mensaje_usuario=COALESCE($1,mensaje_usuario), updated_at=NOW() WHERE id=$2 RETURNING *",
      [mensaje_usuario||null, req.params.id]
    );

    // Crear notificación para admin
    await q('INSERT INTO notifications(tipo,titulo,descripcion,referencia_id) VALUES($1,$2,$3,$4)',
      ['nuevo_proyecto', `Nuevo proyecto enviado: ${check.rows[0].nombre}`,
       `Usuario: ${req.user.username} — ${mensaje_usuario || 'Sin mensaje'}`, parseInt(req.params.id)]);

    return res.json(r.rows[0]);
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

// DELETE /api/projects/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const check = await q('SELECT id,estado FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'No encontrado.' });
    if (check.rows[0].estado === 'enviado') return res.status(400).json({ error: 'No puedes eliminar un proyecto enviado.' });
    await q('DELETE FROM projects WHERE id=$1', [req.params.id]);
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'Error.' }); }
});

module.exports = router;
