const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { query } = require('../db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safe(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    if (username.length < 3) return res.status(400).json({ error: 'Usuario mínimo 3 caracteres.' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email inválido.' });
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres.' });
    if (username.toLowerCase() === 'admin') return res.status(400).json({ error: 'Nombre de usuario no disponible.' });

    const existing = await query('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Usuario o email ya registrado.' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await query(
      "INSERT INTO users (username, email, password_hash, role) VALUES ($1,$2,$3,'user') RETURNING *",
      [username, email, hash]
    );
    const user = result.rows[0];
    return res.status(201).json({ token: signToken(user), user: safe(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Campos requeridos.' });

    const result = await query('SELECT * FROM users WHERE username=$1 OR email=$1', [username]);
    const user = result.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    return res.json({ token: signToken(user), user: safe(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No autorizado' });
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const result = await query('SELECT * FROM users WHERE id=$1', [decoded.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(safe(result.rows[0]));
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
