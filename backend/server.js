require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:4201'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/profile',  require('./routes/profile.routes'));
app.use('/api/projects', require('./routes/projects.routes'));
app.use('/api/pages',    require('./routes/pages.routes'));
app.use('/api/admin',    require('./routes/admin.routes'));
app.use('/api/contact',  require('./routes/contact.routes'));
app.get('/api/health',   (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/*',        (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Error interno.' }); });

// Inicializar BD primero, luego arrancar servidor
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 SAQES Backend en http://localhost:${PORT}`);
    console.log(`🔐 Admin: admin / Admin@123\n`);
  });
}).catch(err => { console.error('Error iniciando BD:', err); process.exit(1); });
