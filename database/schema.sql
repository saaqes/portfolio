-- ═══════════════════════════════════════════════════════════════
-- SAQES PORTFOLIO — Schema SQL completo para Neon (PostgreSQL)
-- Importar en: https://console.neon.tech → SQL Editor → pegar y ejecutar
-- ═══════════════════════════════════════════════════════════════

-- Limpiar si existe (útil para re-importar en desarrollo)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS contact CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS trajectory CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─────────────────────────────────────────────────────────
-- USUARIOS
-- ─────────────────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
  bio           TEXT         DEFAULT '',
  location      VARCHAR(100) DEFAULT '',
  avatar        TEXT         DEFAULT '',
  banner_img    TEXT         DEFAULT '',
  banner_grad   TEXT         DEFAULT 'linear-gradient(135deg,#1a0040,#4b0082)',
  btn_text      VARCHAR(100) DEFAULT '+ Crear Página',
  btn_link      VARCHAR(200) DEFAULT '/builder.html',
  btn_color     VARCHAR(20)  DEFAULT '#8a2be2',
  btn_style     VARCHAR(30)  DEFAULT 'diagonal',
  created_at    TIMESTAMP    DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- ESTADÍSTICAS (hero counters — solo admin las edita)
-- ─────────────────────────────────────────────────────────
CREATE TABLE stats (
  id                  SERIAL PRIMARY KEY,
  proyectos_creados   INTEGER DEFAULT 0,
  usuarios_activos    INTEGER DEFAULT 0,
  paginas_publicadas  INTEGER DEFAULT 0,
  anos_experiencia    INTEGER DEFAULT 3,
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- HABILIDADES
-- ─────────────────────────────────────────────────────────
CREATE TABLE skills (
  id       SERIAL PRIMARY KEY,
  nombre   VARCHAR(100) NOT NULL,
  nivel    INTEGER      NOT NULL DEFAULT 80,  -- 0-100
  icono    VARCHAR(10)  DEFAULT '⚡',
  orden    INTEGER      DEFAULT 0
);

-- ─────────────────────────────────────────────────────────
-- TRAYECTORIA / TIMELINE
-- ─────────────────────────────────────────────────────────
CREATE TABLE trajectory (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(200) NOT NULL,
  empresa     VARCHAR(200) DEFAULT '',
  fecha       VARCHAR(50)  DEFAULT '',
  descripcion TEXT         DEFAULT '',
  orden       INTEGER      DEFAULT 0
);

-- ─────────────────────────────────────────────────────────
-- PROYECTOS (páginas enviadas por usuarios para revisión)
-- ─────────────────────────────────────────────────────────
CREATE TABLE projects (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre           VARCHAR(200) NOT NULL,
  descripcion      TEXT         DEFAULT '',
  contenido_html   TEXT         DEFAULT '',   -- HTML completo generado por el builder
  contenido_css    TEXT         DEFAULT '',   -- CSS del proyecto
  contenido_js     TEXT         DEFAULT '',   -- JS del proyecto
  preview_url      TEXT         DEFAULT '',   -- URL opcional de preview
  thumbnail        TEXT         DEFAULT '',   -- Imagen de miniatura
  estado           VARCHAR(20)  DEFAULT 'borrador',  -- 'borrador'|'enviado'|'aprobado'|'rechazado'
  mensaje_usuario  TEXT         DEFAULT '',   -- Mensaje/instrucciones del usuario
  feedback_admin   TEXT         DEFAULT '',   -- Respuesta del admin
  tags             JSONB        DEFAULT '[]',
  created_at       TIMESTAMP    DEFAULT NOW(),
  updated_at       TIMESTAMP    DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- PÁGINAS BUILDER (borradores — datos JSON del builder)
-- ─────────────────────────────────────────────────────────
CREATE TABLE pages (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre     VARCHAR(200) NOT NULL,
  slug       VARCHAR(200) NOT NULL,
  site_data  JSONB        DEFAULT '{}',   -- JSON completo del estado del builder
  thumbnail  TEXT         DEFAULT '',
  is_public  BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT NOW(),
  updated_at TIMESTAMP    DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- ─────────────────────────────────────────────────────────
-- TESTIMONIOS
-- ─────────────────────────────────────────────────────────
CREATE TABLE testimonials (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  rol        VARCHAR(100) DEFAULT '',
  comentario TEXT         NOT NULL,
  imagen     TEXT         DEFAULT '',
  orden      INTEGER      DEFAULT 0
);

-- ─────────────────────────────────────────────────────────
-- CONTACTO (info del portafolio — solo una fila)
-- ─────────────────────────────────────────────────────────
CREATE TABLE contact (
  id        SERIAL PRIMARY KEY,
  email     VARCHAR(150) DEFAULT '',
  telefono  VARCHAR(50)  DEFAULT '',
  instagram VARCHAR(200) DEFAULT '',
  behance   VARCHAR(200) DEFAULT '',
  linkedin  VARCHAR(200) DEFAULT '',
  github    VARCHAR(200) DEFAULT '',
  direccion TEXT         DEFAULT ''
);

-- ─────────────────────────────────────────────────────────
-- MENSAJES DE CONTACTO (formulario del portfolio)
-- ─────────────────────────────────────────────────────────
CREATE TABLE contact_messages (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  message    TEXT         NOT NULL,
  read       BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- NOTIFICACIONES (para el admin)
-- ─────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id            SERIAL PRIMARY KEY,
  tipo          VARCHAR(50)  NOT NULL,   -- 'nuevo_proyecto'|'mensaje'|'nuevo_usuario'
  titulo        TEXT         NOT NULL,
  descripcion   TEXT         DEFAULT '',
  referencia_id INTEGER      DEFAULT NULL,  -- ID del proyecto o mensaje
  leido         BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMP    DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- CONFIGURACIÓN DEL SITIO (hero texts, colores, etc.)
-- ─────────────────────────────────────────────────────────
CREATE TABLE site_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at TIMESTAMP    DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- DATOS INICIALES (seed)
-- ═══════════════════════════════════════════════════════════════

-- Admin user (contraseña: Admin@123 — cámbiala después)
-- Hash generado con bcrypt rounds=10
INSERT INTO users (username, email, password_hash, role, bio, location)
VALUES (
  'admin',
  'admin@saqes.co',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- "password" de ejemplo
  'admin',
  'Creador de SAQES. Designer & Developer.',
  'Armenia, Colombia'
);
-- ⚠️ IMPORTANTE: El hash de arriba es solo de ejemplo.
-- Al arrancar el servidor por primera vez se crea el admin con Admin@123 correctamente.

-- Stats iniciales
INSERT INTO stats (proyectos_creados, usuarios_activos, paginas_publicadas, anos_experiencia)
VALUES (12, 200, 48, 3);

-- Skills iniciales
INSERT INTO skills (nombre, nivel, icono, orden) VALUES
  ('Diseño UI/UX',   92, '🎨', 1),
  ('Desarrollo Web', 88, '💻', 2),
  ('Apps Móviles',   75, '📱', 3),
  ('Branding',       80, '✏️',  4),
  ('Motion Design',  70, '🎬', 5),
  ('SEO & Marketing',85, '🌐', 6);

-- Trayectoria inicial
INSERT INTO trajectory (titulo, empresa, fecha, descripcion, orden) VALUES
  ('Inicio en Diseño Digital',    '',       '2020',        'Primeros pasos en diseño UI freelance con enfoque en identidad visual urbana.', 1),
  ('Especialización en Frontend', '',       '2021 — 2022', 'Dominio de React, Tailwind y CSS avanzado. Primeros proyectos web full.',       2),
  ('SAQES Builder — Alpha',       'SAQES',  '2023',        'Desarrollo del primer website builder visual especializado en diseño urbano.',   3),
  ('Plataforma Completa',         'SAQES',  '2024 — HOY',  'Expansión del ecosistema SAQES con editor visual avanzado y portafolio.',       4);

-- Testimonios iniciales
INSERT INTO testimonials (nombre, rol, comentario, orden) VALUES
  ('Alex Morales',    'CEO — Beats Underground', 'SAQES transformó completamente la presencia digital de nuestra marca.', 1),
  ('Valentina Cruz',  'Artista Visual',           'La plataforma es increíble. En menos de una hora tenía mi portfolio listo.', 2),
  ('Rodrigo Méndez', 'Músico Independiente',     'Nunca pensé que podría tener un sitio tan profesional sin saber programar.', 3);

-- Contacto inicial
INSERT INTO contact (email, telefono, instagram, behance, linkedin)
VALUES ('hola@saqes.co', '+57 300 000 0000', 'https://instagram.com/saqes', 'https://behance.net/saqes', 'https://linkedin.com/in/saqes');

-- Settings iniciales
INSERT INTO site_settings (key, value) VALUES
  ('hero_title',    'SAQES'),
  ('hero_subtitle', 'Diseño Urbano · Código · Creatividad'),
  ('hero_cta',      'CREA TU PÁGINA'),
  ('primary_color', '#8a2be2'),
  ('accent_color',  '#ff00ff');

-- Índices para performance
CREATE INDEX idx_projects_user_id  ON projects(user_id);
CREATE INDEX idx_projects_estado   ON projects(estado);
CREATE INDEX idx_pages_user_id     ON pages(user_id);
CREATE INDEX idx_notifications_leido ON notifications(leido);
