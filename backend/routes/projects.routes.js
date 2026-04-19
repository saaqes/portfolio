const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

function parseTags(p) { try { p.tags = JSON.parse(p.tags); } catch { p.tags = []; } return p; }

router.get('/', (req, res) => {
  const { all } = getDb();
  const projects = all('SELECT * FROM projects ORDER BY order_idx ASC, id ASC').map(parseTags);
  return res.json(projects);
});

router.post('/', adminMiddleware, (req, res) => {
  const { title, description, image, tags, tech, link } = req.body;
  if (!title) return res.status(400).json({ error: 'Título requerido' });
  const { all, run, get } = getDb();
  const maxRow = all('SELECT MAX(order_idx) as m FROM projects')[0];
  const maxOrd = maxRow?.m ?? 0;
  const r = run('INSERT INTO projects (title,description,image,tags,tech,link,order_idx) VALUES (?,?,?,?,?,?,?)',
    [title, description||'', image||'', JSON.stringify(tags||[]), tech||'', link||'', Number(maxOrd)+1]);
  const project = parseTags(get('SELECT * FROM projects WHERE id=?', [r.lastInsertRowid]));
  return res.status(201).json(project);
});

router.put('/:id', adminMiddleware, (req, res) => {
  const { title, description, image, tags, tech, link } = req.body;
  const { run, get } = getDb();
  run(`UPDATE projects SET title=COALESCE(?,title), description=COALESCE(?,description),
    image=COALESCE(?,image), tags=COALESCE(?,tags), tech=COALESCE(?,tech), link=COALESCE(?,link) WHERE id=?`,
    [title||null, description||null, image||null, tags?JSON.stringify(tags):null, tech||null, link||null, req.params.id]);
  const p = get('SELECT * FROM projects WHERE id=?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Proyecto no encontrado' });
  return res.json(parseTags(p));
});

router.delete('/:id', adminMiddleware, (req, res) => {
  const { run } = getDb();
  run('DELETE FROM projects WHERE id=?', [req.params.id]);
  return res.json({ ok: true });
});

module.exports = router;
