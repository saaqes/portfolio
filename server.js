require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const jwt     = require('jsonwebtoken');
const { neon } = require('@neondatabase/serverless');

const app  = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET     = process.env.JWT_SECRET     || 'jwt-secret-cambiar';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const sql = neon(process.env.DATABASE_URL);

async function initDB() {
  // Crear tablas principales
  await sql`
    CREATE TABLE IF NOT EXISTS briefs_web (
      id                     SERIAL PRIMARY KEY,
      creado_en              TIMESTAMPTZ DEFAULT NOW(),
      nombre_persona         TEXT,
      nombre_negocio         TEXT,
      objetivo               TEXT,
      objetivo_otro          TEXT,
      descripcion_negocio    TEXT,
      correo                 TEXT,
      telefono               TEXT,
      publico_objetivo       TEXT,
      propuesta_valor        TEXT,
      competidores           TEXT,
      estilo                 TEXT,
      estilo_otro            TEXT,
      color_principal_1      TEXT,
      color_principal_2      TEXT,
      color_principal_3      TEXT,
      colores_descripcion    TEXT,
      color_secundario_1     TEXT,
      color_secundario_2     TEXT,
      dark_mode              TEXT,
      tipografia             TEXT,
      tipografia_nombre      TEXT,
      referencias_web        TEXT,
      secciones              TEXT,
      secciones_otras        TEXT,
      pagina_inicio          TEXT,
      menu_posicion          TEXT,
      footer                 TEXT,
      num_paginas            TEXT,
      carrito                TEXT,
      proceso_compra         TEXT,
      proceso_compra_otro    TEXT,
      info_producto          TEXT,
      num_productos          TEXT,
      card_estilo            TEXT,
      resenias               TEXT,
      funcionalidades        TEXT,
      funcionalidades_otras  TEXT,
      whatsapp               TEXT,
      animaciones            TEXT,
      panel_admin            TEXT,
      administrador          TEXT,
      seguridad              TEXT,
      roles                  TEXT,
      roles_descripcion      TEXT,
      tiene_logo             TEXT,
      contenido_listo        TEXT,
      presupuesto            TEXT,
      tiempo                 TEXT,
      referencias_adicionales TEXT,
      categorias             TEXT,
      categorias_descripcion TEXT,
      filtros                TEXT,
      filtros_otros          TEXT,
      productos_destacados   TEXT,
      display_productos      TEXT,
      carrusel               TEXT,
      carrusel_posicion      TEXT,
      carrusel_posicion_otro TEXT,
      carrusel_objetivo      TEXT,
      carrusel_layout        TEXT,
      carrusel_slides        TEXT,
      carrusel_botones       TEXT,
      carrusel_btn_estilo    TEXT,
      carrusel_autoplay      TEXT,
      notificaciones         TEXT,
      notificaciones_otras   TEXT,
      dominio                TEXT,
      dominio_nombre         TEXT,
      hosting                TEXT,
      comentarios            TEXT,
      respuestas_custom      JSONB DEFAULT '{}',
      precio_calculado       TEXT,
      desglose_precios       TEXT
    )
  `;

  // Añadir columnas nuevas si la tabla ya existía antes
  await sql`ALTER TABLE briefs_web ADD COLUMN IF NOT EXISTS precio_calculado TEXT`;
  await sql`ALTER TABLE briefs_web ADD COLUMN IF NOT EXISTS desglose_precios TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS preguntas_custom (
      id        SERIAL PRIMARY KEY,
      seccion   TEXT    NOT NULL DEFAULT 'Extra',
      pregunta  TEXT    NOT NULL,
      tipo      TEXT    NOT NULL DEFAULT 'text',
      opciones  TEXT,
      requerido BOOLEAN DEFAULT false,
      orden     INT     DEFAULT 0,
      activo    BOOLEAN DEFAULT true,
      creado_en TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  console.log('✅  DB lista.');
}

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try { jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

// ── PÚBLICAS ──────────────────────────────────────────
app.get('/api/preguntas', async (req, res) => {
  try {
    const r = await sql`SELECT id,seccion,pregunta,tipo,opciones,requerido FROM preguntas_custom WHERE activo=true ORDER BY orden,id`;
    res.json(r);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/submit', async (req, res) => {
  const d = req.body;
  if (!d.nombre_persona?.trim() || !d.nombre_negocio?.trim() || !d.correo?.trim())
    return res.status(400).json({ error: 'Tu nombre, nombre del negocio y correo son obligatorios.' });
  try {
    const r = await sql`
      INSERT INTO briefs_web (
        nombre_persona,nombre_negocio,objetivo,objetivo_otro,descripcion_negocio,correo,telefono,
        publico_objetivo,propuesta_valor,competidores,
        estilo,estilo_otro,color_principal_1,color_principal_2,color_principal_3,
        colores_descripcion,color_secundario_1,color_secundario_2,
        dark_mode,tipografia,tipografia_nombre,referencias_web,
        secciones,secciones_otras,pagina_inicio,menu_posicion,footer,num_paginas,
        carrito,proceso_compra,proceso_compra_otro,info_producto,num_productos,card_estilo,resenias,
        funcionalidades,funcionalidades_otras,whatsapp,animaciones,
        panel_admin,administrador,seguridad,roles,roles_descripcion,
        tiene_logo,contenido_listo,presupuesto,tiempo,
        referencias_adicionales,
        categorias,categorias_descripcion,filtros,filtros_otros,productos_destacados,display_productos,
        carrusel,carrusel_posicion,carrusel_posicion_otro,carrusel_objetivo,
        carrusel_layout,carrusel_slides,carrusel_botones,carrusel_btn_estilo,carrusel_autoplay,
        notificaciones,notificaciones_otras,dominio,dominio_nombre,hosting,comentarios,
        respuestas_custom, precio_calculado, desglose_precios
      ) VALUES (
        ${d.nombre_persona||null},${d.nombre_negocio||null},${d.objetivo||null},${d.objetivo_otro||null},
        ${d.descripcion_negocio||null},${d.correo||null},${d.telefono||null},
        ${d.publico_objetivo||null},${d.propuesta_valor||null},${d.competidores||null},
        ${d.estilo||null},${d.estilo_otro||null},${d.color_principal_1||null},${d.color_principal_2||null},${d.color_principal_3||null},
        ${d.colores_descripcion||null},${d.color_secundario_1||null},${d.color_secundario_2||null},
        ${d.dark_mode||null},${d.tipografia||null},${d.tipografia_nombre||null},${d.referencias_web||null},
        ${d.secciones||null},${d.secciones_otras||null},${d.pagina_inicio||null},${d.menu_posicion||null},${d.footer||null},${d.num_paginas||null},
        ${d.carrito||null},${d.proceso_compra||null},${d.proceso_compra_otro||null},${d.info_producto||null},${d.num_productos||null},${d.card_estilo||null},${d.resenias||null},
        ${d.funcionalidades||null},${d.funcionalidades_otras||null},${d.whatsapp||null},${d.animaciones||null},
        ${d.panel_admin||null},${d.administrador||null},${d.seguridad||null},${d.roles||null},${d.roles_descripcion||null},
        ${d.tiene_logo||null},${d.contenido_listo||null},${d.presupuesto||null},${d.tiempo||null},
        ${d.referencias_adicionales||null},
        ${d.categorias||null},${d.categorias_descripcion||null},${d.filtros||null},${d.filtros_otros||null},${d.productos_destacados||null},${d.display_productos||null},
        ${d.carrusel||null},${d.carrusel_posicion||null},${d.carrusel_posicion_otro||null},${d.carrusel_objetivo||null},
        ${d.carrusel_layout||null},${d.carrusel_slides||null},${d.carrusel_botones||null},${d.carrusel_btn_estilo||null},${d.carrusel_autoplay||null},
        ${d.notificaciones||null},${d.notificaciones_otras||null},${d.dominio||null},${d.dominio_nombre||null},${d.hosting||null},${d.comentarios||null},
        ${JSON.stringify(d.respuestas_custom||{})},
        ${d.precio_calculado||null},
        ${d.desglose_precios||null}
      ) RETURNING id`;
    console.log(`📝  Brief #${r[0].id} — ${d.nombre_persona} (${d.correo}) — Precio: $${d.precio_calculado}`);
    res.status(201).json({ ok:true, id:r[0].id });
  } catch(e){ console.error(e.message); res.status(500).json({error:'Error al guardar.'}); }
});

// ── ADMIN ─────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({error:'Contraseña incorrecta'});
  res.json({ token: jwt.sign({admin:true}, JWT_SECRET, {expiresIn:'8h'}) });
});

app.get('/api/admin/briefs', auth, async (req,res) => {
  try {
    res.json(await sql`
      SELECT id, nombre_persona, nombre_negocio, correo, objetivo, presupuesto,
             precio_calculado, creado_en
      FROM briefs_web ORDER BY creado_en DESC
    `);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/admin/briefs/:id', auth, async (req,res) => {
  try {
    const r = await sql`SELECT * FROM briefs_web WHERE id=${req.params.id}`;
    if(!r.length) return res.status(404).json({error:'No encontrado'});
    res.json(r[0]);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.delete('/api/admin/briefs/:id', auth, async (req,res) => {
  try { await sql`DELETE FROM briefs_web WHERE id=${req.params.id}`; res.json({ok:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/api/admin/preguntas', auth, async (req,res) => {
  try { res.json(await sql`SELECT * FROM preguntas_custom ORDER BY orden,id`); }
  catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/admin/preguntas', auth, async (req,res) => {
  const {seccion,pregunta,tipo,opciones,requerido,orden} = req.body;
  try {
    const r = await sql`INSERT INTO preguntas_custom (seccion,pregunta,tipo,opciones,requerido,orden) VALUES (${seccion||'Extra'},${pregunta},${tipo||'text'},${opciones||null},${!!requerido},${orden||0}) RETURNING *`;
    res.status(201).json(r[0]);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.put('/api/admin/preguntas/:id', auth, async (req,res) => {
  const {seccion,pregunta,tipo,opciones,requerido,orden,activo} = req.body;
  try {
    const r = await sql`UPDATE preguntas_custom SET seccion=${seccion},pregunta=${pregunta},tipo=${tipo},opciones=${opciones||null},requerido=${!!requerido},orden=${orden||0},activo=${!!activo} WHERE id=${req.params.id} RETURNING *`;
    res.json(r[0]);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.delete('/api/admin/preguntas/:id', auth, async (req,res) => {
  try { await sql`DELETE FROM preguntas_custom WHERE id=${req.params.id}`; res.json({ok:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

app.get('/admin', (_,res) => res.sendFile(path.join(__dirname,'admin.html')));

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀  http://localhost:${PORT}`);
    console.log(`📋  Formulario → http://localhost:${PORT}/`);
    console.log(`🔐  Admin      → http://localhost:${PORT}/admin\n`);
  });
}).catch(e => { console.error('❌  Neon error:', e.message); process.exit(1); });
