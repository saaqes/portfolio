require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDb } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: (origin, cb) => cb(null, true), // permisivo — ajustar en producción
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));  // 50mb para HTML/CSS completos del builder
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Servir frontend estático ──
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ──
app.use('/api/auth',    require('./routes/auth.routes'));
app.use('/api/public',  require('./routes/public.routes'));
app.use('/api/projects',require('./routes/projects.routes'));
app.use('/api/pages',   require('./routes/pages.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/admin',   require('./routes/admin.routes'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV })
);

// ── SPA fallback: servir index.html para rutas no-API ──
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Ruta no encontrada' });
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno.' });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 SAQES API → http://localhost:${PORT}`);
    console.log(`🔐 Admin: admin / Admin@123`);
    console.log(`📁 Frontend: http://localhost:${PORT}\n`);
  });
}).catch(err => { console.error('❌ Error BD:', err.message); process.exit(1); });
