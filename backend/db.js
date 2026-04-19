/**
 * SAQES Portfolio — PostgreSQL Database
 * Usa la variable de entorno DATABASE_URL provista por Render
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Pool de conexiones — Render provee DATABASE_URL automáticamente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }   // Render requiere SSL en producción
    : false
});

// ── Helper: ejecutar query con parámetros ──
async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

// ── Inicializar tablas ──
async function initDb() {
  console.log('🔌 Conectando a PostgreSQL...');

  // Esperar conexión
  await pool.query('SELECT 1');
  console.log('✅ Conexión exitosa a PostgreSQL');

  // Crear tablas si no existen
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      bio TEXT DEFAULT '',
      location VARCHAR(100) DEFAULT '',
      avatar TEXT DEFAULT '',
      banner_img TEXT DEFAULT '',
      banner_grad TEXT DEFAULT '',
      btn_text VARCHAR(100) DEFAULT '+ Crear Página',
      btn_link VARCHAR(200) DEFAULT '/builder',
      btn_color VARCHAR(20) DEFAULT '#8a2be2',
      btn_style VARCHAR(30) DEFAULT 'diagonal',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      tags JSONB DEFAULT '[]',
      tech VARCHAR(200) DEFAULT '',
      link TEXT DEFAULT '',
      order_idx INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_pages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      page_name VARCHAR(200) NOT NULL,
      page_slug VARCHAR(200) NOT NULL,
      page_data JSONB DEFAULT '{}',
      thumbnail TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, page_slug)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Seed inicial
  await seedDefaults();

  console.log('✅ Base de datos lista.');
}

async function seedDefaults() {
  // Admin user
  const adminCheck = await pool.query("SELECT id FROM users WHERE username = 'admin'");
  if (adminCheck.rows.length === 0) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role, bio, location)
       VALUES ($1, $2, $3, 'admin', 'Creador de SAQES.', 'Colombia')`,
      ['admin', 'admin@saqes.co', hash]
    );
    console.log('✅ Admin creado: admin / Admin@123');
  }

  // Site settings
  const settingsCheck = await pool.query("SELECT key FROM site_settings WHERE key = 'hero_title'");
  if (settingsCheck.rows.length === 0) {
    const defaults = [
      ['hero_title',    'SAQES'],
      ['hero_subtitle', 'Diseño Urbano · Código · Creatividad'],
      ['hero_cta',      'CREA TU PÁGINA'],
      ['primary_color', '#8a2be2'],
      ['accent_color',  '#ff00ff'],
    ];
    for (const [k, v] of defaults) {
      await pool.query(
        'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [k, v]
      );
    }
  }

  // Sample projects
  const projCheck = await pool.query('SELECT COUNT(*) as cnt FROM projects');
  if (parseInt(projCheck.rows[0].cnt) === 0) {
    const projs = [
      ['FORMA — Virtual Try-On', 'App de prueba virtual con MediaPipe y AI.',           '[]', 'Node.js · MediaPipe · Replicate', '#', 0],
      ['SAQES Builder',          'Website builder visual para diseño urbano.',           '[]', 'Angular · Express · PostgreSQL',   '#', 1],
      ['Urban ID',               'Sistema de identidad visual para marcas urbanas.',     '[]', 'Figma · Illustrator',              '#', 2],
    ];
    for (const p of projs) {
      await pool.query(
        'INSERT INTO projects (title, description, tags, tech, link, order_idx) VALUES ($1,$2,$3,$4,$5,$6)',
        p
      );
    }
    console.log('✅ Proyectos de ejemplo creados.');
  }
}

module.exports = { pool, query, initDb };
