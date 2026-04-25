# 📋 Brief Página Web — Guía de Despliegue

## Archivos del proyecto

```
📁 proyecto/
├── server.js        ← Backend Express + Neon
├── index.html       ← Formulario público
├── admin.html       ← Panel de administración
├── package.json     ← Dependencias
├── .env.example     ← Plantilla de variables de entorno
└── .env             ← Tu configuración (no subir a GitHub)
```

---

## PASO 1 — Crear base de datos en Neon

1. Ve a **https://console.neon.tech** e inicia sesión (puedes usar GitHub)
2. Haz clic en **"New Project"**
3. Ponle un nombre (ej. `brief-web`) y elige la región más cercana (ej. `US East`)
4. Una vez creado, ve a **"Connection details"**
5. Copia el **Connection string** — se ve así:
   ```
   postgresql://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. Guárdalo, lo necesitarás en el paso siguiente.

> **Nota:** Las tablas `briefs_web` y `preguntas_custom` se crean automáticamente
> la primera vez que el servidor arranca. No necesitas crear nada más en Neon.

---

## PASO 2 — Subir el proyecto a GitHub

1. Crea un repositorio en **https://github.com/new**
2. Sube los archivos:
   ```bash
   git init
   git add server.js index.html admin.html package.json .env.example
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/brief-web.git
   git push -u origin main
   ```
   > ⚠️ **NO subas el archivo `.env`** — contiene tus contraseñas

---

## PASO 3 — Desplegar en Render

1. Ve a **https://render.com** e inicia sesión (puedes usar GitHub)
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura el servicio:

   | Campo             | Valor                     |
   |-------------------|---------------------------|
   | **Name**          | `brief-web` (o lo que quieras) |
   | **Runtime**       | `Node`                    |
   | **Build Command** | `npm install`             |
   | **Start Command** | `node server.js`          |
   | **Instance Type** | `Free`                    |

5. Añade las **Variables de entorno** (pestaña "Environment"):

   | Variable           | Valor                                    |
   |--------------------|------------------------------------------|
   | `DATABASE_URL`     | El connection string de Neon (paso 1)    |
   | `ADMIN_PASSWORD`   | Tu contraseña del admin (ej. `MiClave2024!`) |
   | `JWT_SECRET`       | Una cadena larga aleatoria (ej. `xK9#mN2$pQr8vL5...`) |

6. Haz clic en **"Create Web Service"**
7. Render instalará dependencias y desplegará. En 2-3 minutos tendrás tu URL:
   ```
   https://brief-web.onrender.com
   ```

---

## URLs disponibles

Una vez desplegado:

| URL                              | Descripción                    |
|----------------------------------|--------------------------------|
| `https://tu-app.onrender.com/`   | Formulario público para clientes |
| `https://tu-app.onrender.com/admin` | Panel de administración    |

---

## Prueba local antes de desplegar

```bash
# 1. Instalar dependencias
npm install

# 2. Crear tu .env
cp .env.example .env
# Edita .env con tu DATABASE_URL de Neon

# 3. Arrancar
npm run dev
# o: node server.js

# 4. Abrir en el navegador
# Formulario: http://localhost:3000/
# Admin:      http://localhost:3000/admin
```

---

## Uso del panel Admin

1. Ve a `tu-app/admin`
2. Ingresa la contraseña definida en `ADMIN_PASSWORD`
3. En **"Formularios"** verás todos los briefs recibidos con:
   - Nombre, negocio, correo, objetivo, presupuesto y fecha
   - Botón **"Ver →"** para ver la respuesta exacta de cada pregunta
4. En **"Preguntas"** puedes:
   - Añadir preguntas nuevas que aparecerán al final del formulario
   - Editar o eliminar preguntas existentes
   - Elegir tipo: texto corto, texto largo, opción única o selección múltiple
   - Activar/desactivar preguntas sin eliminarlas

---

## Notas importantes

- **Free tier de Render:** El servidor puede "dormirse" después de 15 min de inactividad.
  La primera solicitud puede tardar 30-60 segundos en despertar. Para evitarlo, considera
  el plan Starter ($7/mes).
- **Free tier de Neon:** Hasta 0.5 GB de almacenamiento y 190 horas de cómputo al mes.
  Más que suficiente para este proyecto.
- **Tokens JWT:** Expiran en 8 horas. Si el admin cierra el navegador y vuelve,
  deberá ingresar la contraseña de nuevo.
