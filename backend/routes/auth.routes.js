const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
require('dotenv').config();

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
function safe(u) { if (!u) return null; const { password_hash, ...r } = u; return r; }

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  if (username.length < 3) return res.status(400).json({ error: 'Usuario mínimo 3 caracteres.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email inválido.' });
  if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres.' });
  if (username.toLowerCase() === 'admin') return res.status(400).json({ error: 'Nombre de usuario no disponible.' });

  const { get, run } = getDb();
  if (get('SELECT id FROM users WHERE username=? OR email=?', [username, email]))
    return res.status(409).json({ error: 'Usuario o email ya registrado.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = run(`INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,'user')`, [username, email, hash]);
  const user = get('SELECT * FROM users WHERE id=?', [result.lastInsertRowid]);
  return res.status(201).json({ token: signToken(user), user: safe(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Campos requeridos.' });
  const { get } = getDb();
  const user = get('SELECT * FROM users WHERE username=? OR email=?', [username, username]);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  return res.json({ token: signToken(user), user: safe(user) });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const { get } = getDb();
    const user = get('SELECT * FROM users WHERE id=?', [decoded.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(safe(user));
  } catch { return res.status(401).json({ error: 'Token inválido' }); }
});

module.exports = router;
