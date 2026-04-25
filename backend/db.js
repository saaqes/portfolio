const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const q = (sql, p = []) => pool.query(sql, p);

async function initDb() {
  await q('SELECT 1'); // test conexión
  console.log('✅ PostgreSQL conectado');

  // Crear tablas
  await q(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', bio TEXT DEFAULT '',
    location VARCHAR(100) DEFAULT '', avatar TEXT DEFAULT '',
    banner_img TEXT DEFAULT '', banner_grad TEXT DEFAULT 'linear-gradient(135deg,#1a0040,#4b0082)',
    btn_text VARCHAR(100) DEFAULT '+ Crear Página', btn_link VARCHAR(200) DEFAULT '/builder.html',
    btn_color VARCHAR(20) DEFAULT '#8a2be2', btn_style VARCHAR(30) DEFAULT 'diagonal',
    created_at TIMESTAMP DEFAULT NOW())`);

  await q(`CREATE TABLE IF NOT EXISTS stats (
    id SERIAL PRIMARY KEY, proyectos_creados INTEGER DEFAULT 0,
    usuarios_activos INTEGER DEFAULT 0, paginas_publicadas INTEGER DEFAULT 0,
    anos_experiencia INTEGER DEFAULT 3, updated_at TIMESTAMP DEFAULT NOW())`);

  await q(`CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL,
    nivel INTEGER NOT NULL DEFAULT 80, icono VARCHAR(10) DEFAULT '⚡', orden INTEGER DEFAULT 0)`);

  await q(`CREATE TABLE IF NOT EXISTS trajectory (
    id SERIAL PRIMARY KEY, titulo VARCHAR(200) NOT NULL,
    empresa VARCHAR(200) DEFAULT '', fecha VARCHAR(50) DEFAULT '',
    descripcion TEXT DEFAULT '', orden INTEGER DEFAULT 0)`);

  await q(`CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL, descripcion TEXT DEFAULT '',
    contenido_html TEXT DEFAULT '', contenido_css TEXT DEFAULT '', contenido_js TEXT DEFAULT '',
    preview_url TEXT DEFAULT '', thumbnail TEXT DEFAULT '',
    estado VARCHAR(20) DEFAULT 'borrador', mensaje_usuario TEXT DEFAULT '',
    feedback_admin TEXT DEFAULT '', tags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);

  await q(`CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL, slug VARCHAR(200) NOT NULL,
    site_data JSONB DEFAULT '{}', thumbnail TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, slug))`);

  await q(`CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, rol VARCHAR(100) DEFAULT '',
    comentario TEXT NOT NULL, imagen TEXT DEFAULT '', orden INTEGER DEFAULT 0)`);

  await q(`CREATE TABLE IF NOT EXISTS contact (
    id SERIAL PRIMARY KEY, email VARCHAR(150) DEFAULT '', telefono VARCHAR(50) DEFAULT '',
    instagram VARCHAR(200) DEFAULT '', behance VARCHAR(200) DEFAULT '',
    linkedin VARCHAR(200) DEFAULT '', github VARCHAR(200) DEFAULT '', direccion TEXT DEFAULT '')`);

  await q(`CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL,
    message TEXT NOT NULL, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())`);

  await q(`CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY, tipo VARCHAR(50) NOT NULL, titulo TEXT NOT NULL,
    descripcion TEXT DEFAULT '', referencia_id INTEGER DEFAULT NULL,
    leido BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())`);

  await q(`CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMP DEFAULT NOW())`);

  await seed();
  console.log('✅ Tablas listas');
}

async function seed() {
  // Admin
  const admin = await q("SELECT id FROM users WHERE username='admin'");
  if (!admin.rows.length) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    await q("INSERT INTO users(username,email,password_hash,role,bio,location) VALUES($1,$2,$3,'admin',$4,$5)",
      ['admin','admin@saqes.co', hash,'Creador de SAQES. Designer & Developer.','Armenia, Colombia']);
    console.log('✅ Admin: admin / Admin@123');
  }

  // Stats
  const s = await q('SELECT id FROM stats');
  if (!s.rows.length) await q('INSERT INTO stats(proyectos_creados,usuarios_activos,paginas_publicadas,anos_experiencia) VALUES(12,200,48,3)');

  // Skills
  const sk = await q('SELECT id FROM skills');
  if (!sk.rows.length) {
    const skills = [['Diseño UI/UX',92,'🎨',1],['Desarrollo Web',88,'💻',2],['Apps Móviles',75,'📱',3],['Branding',80,'✏️',4],['Motion Design',70,'🎬',5],['SEO & Marketing',85,'🌐',6]];
    for (const [n,l,i,o] of skills) await q('INSERT INTO skills(nombre,nivel,icono,orden) VALUES($1,$2,$3,$4)',[n,l,i,o]);
  }

  // Trajectory
  const tr = await q('SELECT id FROM trajectory');
  if (!tr.rows.length) {
    const traj = [
      ['Inicio en Diseño Digital','','2020','Primeros pasos en diseño UI freelance.',1],
      ['Especialización en Frontend','','2021 — 2022','Dominio de React, Tailwind y CSS avanzado.',2],
      ['SAQES Builder — Alpha','SAQES','2023','Primer website builder visual para diseño urbano.',3],
      ['Plataforma Completa','SAQES','2024 — HOY','Expansión del ecosistema SAQES.',4],
    ];
    for (const [t,e,f,d,o] of traj) await q('INSERT INTO trajectory(titulo,empresa,fecha,descripcion,orden) VALUES($1,$2,$3,$4,$5)',[t,e,f,d,o]);
  }

  // Testimonials
  const te = await q('SELECT id FROM testimonials');
  if (!te.rows.length) {
    const test = [
      ['Alex Morales','CEO — Beats Underground','SAQES transformó completamente la presencia digital de nuestra marca.',1],
      ['Valentina Cruz','Artista Visual','La plataforma es increíble. En menos de una hora tenía mi portfolio listo.',2],
      ['Rodrigo Méndez','Músico Independiente','Nunca pensé que podría tener un sitio tan profesional sin saber programar.',3],
    ];
    for (const [n,r,c,o] of test) await q('INSERT INTO testimonials(nombre,rol,comentario,orden) VALUES($1,$2,$3,$4)',[n,r,c,o]);
  }

  // Contact
  const co = await q('SELECT id FROM contact');
  if (!co.rows.length) await q("INSERT INTO contact(email,telefono,instagram) VALUES('hola@saqes.co','+57 300 000 0000','https://instagram.com/saqes')");

  // Settings
  const se = await q("SELECT key FROM site_settings WHERE key='hero_title'");
  if (!se.rows.length) {
    const defaults = [['hero_title','SAQES'],['hero_subtitle','Diseño Urbano · Código · Creatividad'],['hero_cta','CREA TU PÁGINA'],['primary_color','#8a2be2'],['accent_color','#ff00ff']];
    for (const [k,v] of defaults) await q('INSERT INTO site_settings(key,value) VALUES($1,$2) ON CONFLICT DO NOTHING',[k,v]);
  }
}

module.exports = { pool, q, initDb };
