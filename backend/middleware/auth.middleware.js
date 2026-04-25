const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
  try { req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Token inválido' }); }
};

const adminMiddleware = (req, res, next) =>
  authMiddleware(req, res, () =>
    req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Solo admin' }));

const optionalAuth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) { req.user = null; return next(); }
  try { req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET); }
  catch { req.user = null; }
  next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuth };
