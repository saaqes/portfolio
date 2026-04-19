require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDb } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS — permite el frontend de Render y localhost ──
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  process.env.FRONTEND_URL,   // ej: https://saqes-portfolio.onrender.com
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origen no permitido'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rutas ──
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/profile',  require('./routes/profile.routes'));
app.use('/api/projects', require('./routes/projects.routes'));
app.use('/api/pages',    require('./routes/pages.routes'));
app.use('/api/admin',    require('./routes/admin.routes'));
app.use('/api/contact',  require('./routes/contact.routes'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV })
);

app.use('/api/*', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ── Iniciar BD primero, luego servidor ──
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 SAQES API corriendo en puerto ${PORT}`);
      console.log(`🌐 ENV: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('❌ Error iniciando base de datos:', err.message);
    process.exit(1);
  });
