/**
 * SAQES Portfolio — Base de datos SQLite con sql.js (puro JavaScript)
 * No requiere compilación nativa. Compatible con cualquier plataforma.
 */
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'portfolio.db');

let db = null;
let dirty = false;

function saveToDisk() {
  if (!db || !dirty) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    dirty = false;
  } catch (e) { console.error('Error guardando BD:', e.message); }
}

function markDirty() { dirty = true; }

// Helper: SELECT → array de objetos
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  const results = [];
  stmt.bind(params);
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

// Helper: primer resultado
function get(sql, params = []) { return all(sql, params)[0] || null; }

// Helper: INSERT/UPDATE/DELETE → { lastInsertRowid }
function run(sql, params = []) {
  db.run(sql, params);
  markDirty();
  const r = db.exec('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: r?.[0]?.values?.[0]?.[0] || null };
}

// Helper: múltiples statements
function exec(sql) { db.run(sql); markDirty(); }

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('✅ BD cargada desde:', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('✅ Nueva BD creada en:', DB_PATH);
  }

  setInterval(saveToDisk, 3000);
  ['exit','SIGINT','SIGTERM'].forEach(e => process.on(e, () => { saveToDisk(); if (e !== 'exit') process.exit(0); }));

  // Tablas
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', bio TEXT DEFAULT '',
    location TEXT DEFAULT '', avatar TEXT DEFAULT '',
    banner_img TEXT DEFAULT '', banner_grad TEXT DEFAULT '',
    btn_text TEXT DEFAULT '+ Crear Página', btn_link TEXT DEFAULT '/builder',
    btn_color TEXT DEFAULT '#8a2be2', btn_style TEXT DEFAULT 'diagonal',
    created_at DATETIME DEFAULT (datetime('now')))`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
    description TEXT DEFAULT '', image TEXT DEFAULT '',
    tags TEXT DEFAULT '[]', tech TEXT DEFAULT '',
    link TEXT DEFAULT '', order_idx INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')))`);

  db.run(`CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL,
    updated_at DATETIME DEFAULT (datetime('now')))`);

  db.run(`CREATE TABLE IF NOT EXISTS user_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    page_name TEXT NOT NULL, page_slug TEXT NOT NULL,
    page_data TEXT NOT NULL DEFAULT '{}', thumbnail TEXT DEFAULT '',
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')))`);

  db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    email TEXT NOT NULL, message TEXT NOT NULL,
    read INTEGER DEFAULT 0, created_at DATETIME DEFAULT (datetime('now')))`);

  markDirty();
  seedDefaults();
  saveToDisk();
  console.log('✅ Base de datos lista.');
  return { all, get, run, exec };
}

function seedDefaults() {
  if (!get('SELECT id FROM users WHERE username = ?', ['admin'])) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    db.run(`INSERT INTO users (username,email,password_hash,role,bio,location) VALUES (?,?,?,'admin','Creador de SAQES.','Colombia')`,
      ['admin','admin@saqes.co',hash]);
    markDirty();
    console.log('✅ Admin creado: admin / Admin@123');
  }
  if (!get("SELECT value FROM site_settings WHERE key='hero_title'")) {
    [['hero_title','SAQES'],['hero_subtitle','Diseño Urbano · Código · Creatividad'],
     ['hero_cta','CREA TU PÁGINA'],['primary_color','#8a2be2'],['accent_color','#ff00ff']]
      .forEach(([k,v]) => db.run('INSERT OR IGNORE INTO site_settings (key,value) VALUES (?,?)',[k,v]));
    markDirty();
  }
  const cnt = all('SELECT COUNT(*) as cnt FROM projects')[0]?.cnt || 0;
  if (Number(cnt) === 0) {
    [['FORMA — Virtual Try-On','App de prueba virtual con MediaPipe y AI.','','["AI","CV","UX"]','Node.js · MediaPipe · Replicate','#',0],
     ['SAQES Builder','Website builder visual para diseño urbano.','','["Builder","SaaS"]','Angular · Express · SQLite','#',1],
     ['Urban ID','Sistema de identidad visual para marcas urbanas.','','["Branding","Design"]','Figma · Illustrator','#',2]]
      .forEach(p => db.run('INSERT INTO projects (title,description,image,tags,tech,link,order_idx) VALUES (?,?,?,?,?,?,?)',p));
    markDirty();
  }
}

function getDb() { return { all, get, run, exec }; }

module.exports = { initDb, getDb };
