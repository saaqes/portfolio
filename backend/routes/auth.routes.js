const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { q }   = require('../db');

const sign = u => jwt.sign({ id: u.id, username: u.username, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const safe = u => { if (!u) return null; const { password_hash, ...r } = u; return r; };

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Campos requeridos.' });
    if (username.length < 3)             return res.status(400).json({ error: 'Usuario mínimo 3 caracteres.' });
    if (password.length < 6)             return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres.' });
    if (username.toLowerCase() === 'admin') return res.status(400).json({ error: 'Nombre no disponible.' });

    const ex = await q('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
    if (ex.rows.length) return res.status(409).json({ error: 'Usuario o email ya registrado.' });

    const hash = bcrypt.hashSync(password, 10);
    const r = await q("INSERT INTO users(username,email,password_hash,role) VALUES($1,$2,$3,'user') RETURNING *", [username, email, hash]);
    const user = r.rows[0];

    // Notificación para admin
    await q('INSERT INTO notifications(tipo,titulo,descripcion) VALUES($1,$2,$3)',
      ['nuevo_usuario', `Nuevo usuario: ${username}`, `Se registró ${email}`]);

    return res.status(201).json({ token: sign(user), user: safe(user) });
  } catch (e) { console.error(e); return res.status(500).json({ error: 'Error interno.' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Campos requeridos.' });
    const r = await q('SELECT * FROM users WHERE username=$1 OR email=$1', [username]);
    const user = r.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    return res.json({ token: sign(user), user: safe(user) });
  } catch (e) { return res.status(500).json({ error: 'Error interno.' }); }
});

router.get('/me', async (req, res) => {
  try {
    const h = req.headers.authorization;
    if (!h) return res.status(401).json({ error: 'No autorizado' });
    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    const r = await q('SELECT * FROM users WHERE id=$1', [decoded.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' });
    return res.json(safe(r.rows[0]));
  } catch { return res.status(401).json({ error: 'Token inválido' }); }
});

module.exports = router;
