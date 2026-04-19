const express  = require('express');
const router   = express.Router();
const { query } = require('../db');
const { adminMiddleware } = require('../middleware/auth.middleware');

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects ORDER BY order_idx ASC, id ASC');
    return res.json(result.rows);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { title, description, image, tags, tech, link } = req.body;
    if (!title) return res.status(400).json({ error: 'Título requerido' });
    const maxRes = await query('SELECT MAX(order_idx) as m FROM projects');
    const maxOrd = (maxRes.rows[0]?.m ?? 0) + 1;
    const result = await query(
      'INSERT INTO projects (title,description,image,tags,tech,link,order_idx) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description||'', image||'', JSON.stringify(tags||[]), tech||'', link||'', maxOrd]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { title, description, image, tags, tech, link } = req.body;
    const result = await query(
      `UPDATE projects SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        image=COALESCE($3,image), tags=COALESCE($4,tags),
        tech=COALESCE($5,tech), link=COALESCE($6,link)
       WHERE id=$7 RETURNING *`,
      [title||null, description||null, image||null, tags?JSON.stringify(tags):null, tech||null, link||null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Proyecto no encontrado' });
    return res.json(result.rows[0]);
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    return res.json({ ok: true });
  } catch (err) { return res.status(500).json({ error: 'Error interno.' }); }
});

module.exports = router;
