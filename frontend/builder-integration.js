/**
 * Builder API Integration
 * Reemplaza localStorage del builder por llamadas a la API.
 * Se carga al final de builder.html.
 */

// ─── Leer pageId de la URL ───
const _builderPageId = new URLSearchParams(window.location.search).get('pageId');
let   _currentPageId  = _builderPageId ? parseInt(_builderPageId) : null;

// ─── OVERRIDE: saveData ───
const _originalSaveData = window.saveData;
window.saveData = async function () {
  // Guardar en localStorage como respaldo inmediato (comportamiento original)
  if (typeof _originalSaveData === 'function') {
    try { _originalSaveData(); } catch (e) {}
  }

  // Guardar en la API
  try {
    const site = JSON.parse(localStorage.getItem('saqes_builder_v3') || '{}');
    const nombre = site?.site?.name || document.getElementById('site-name-input')?.value || 'Mi Página';

    const payload = {
      nombre,
      site_data: site,
      thumbnail: '', // Se puede generar con html2canvas en futuro
    };

    if (_currentPageId) {
      await API.updatePage(_currentPageId, payload);
    } else {
      const page = await API.createPage(payload);
      _currentPageId = page.id;
      // Actualizar URL sin recargar
      history.replaceState(null, '', `/builder.html?pageId=${page.id}`);
    }

    // Guardar también en las páginas del usuario
    const user = await API.me();
    if (user) {
      // sync en localStorage para compatibilidad con renderRepoTeaser
      localStorage.setItem(`saqes_builder_pages_${user.username}`,
        JSON.stringify([{ id: _currentPageId, name: nombre, created: new Date().toLocaleDateString('es-CO') }])
      );
    }

    // Feedback visual
    const dot = document.getElementById('saveDot');
    if (dot) { dot.className = 'save-dot saved'; setTimeout(() => dot.className = 'save-dot', 2000); }

    toast('✅ Guardado en la nube', 'success');
  } catch (e) {
    console.error('saveData API error:', e);
    toast('⚠ Guardado local (sin conexión)', 'warning');
  }
};

// ─── OVERRIDE: exportHTML — también guarda el proyecto completo ───
const _originalExportHTML = window.exportHTML;
window.exportHTML = async function () {
  // Ejecutar export original (descarga el archivo)
  if (typeof _originalExportHTML === 'function') {
    _originalExportHTML();
  }

  // Guardar HTML/CSS en la BD como snapshot del proyecto
  try {
    const user = window.SAQES_USER || await API.me();
    if (!user || !_currentPageId) return;

    // Obtener HTML del canvas
    const canvas = document.getElementById('editor-canvas');
    const htmlContent = canvas ? canvas.innerHTML : '';

    // Obtener CSS inline del builder
    const styleEls = document.querySelectorAll('style[data-builder]');
    let cssContent = '';
    styleEls.forEach(s => cssContent += s.textContent);

    // Actualizar o crear proyecto con el HTML completo
    const nombre = document.getElementById('site-name-input')?.value || 'Mi Proyecto';

    if (_currentPageId) {
      await API.updateProject(_currentPageId, {
        nombre,
        contenido_html: htmlContent,
        contenido_css:  cssContent,
      }).catch(() => {
        // Si no existe como proyecto, crear uno
        return API.createProject({ nombre, contenido_html: htmlContent, contenido_css: cssContent });
      });
    }
  } catch (e) { console.warn('exportHTML API:', e); }
};

// ─── SUBMIT PROJECT ─── (botón "Enviar para revisión")
window.submitBuilderProject = async function () {
  if (!_currentPageId) {
    toast('Guarda la página primero.', 'error');
    return;
  }
  const msg = prompt('¿Algún mensaje para el admin? (ej: "quiero animaciones", "necesito backend")');
  try {
    await saveData(); // guardar primero
    await API.submitProject(_currentPageId, msg || '');
    toast('✅ Proyecto enviado para revisión.', 'success');
  } catch (e) { toast(e.error || 'Error al enviar.', 'error'); }
};

// ─── CARGAR PÁGINA EXISTENTE ───
async function loadBuilderPage() {
  if (!_currentPageId) return;

  try {
    const page = await API.getPage(_currentPageId);
    if (page?.site_data) {
      // Guardar en localStorage para que el builder lo detecte
      localStorage.setItem('saqes_builder_v3', JSON.stringify(page.site_data));
    }
    // El builder carga desde localStorage en su init — ya está cubierto
    toast('Página cargada desde la nube.', 'info');
  } catch (e) {
    console.warn('No se pudo cargar la página:', e);
  }
}

// ─── AGREGAR BOTÓN "ENVIAR PARA REVISIÓN" en el topbar ───
function addSubmitButton() {
  const topbar = document.querySelector('.top-bar, #builder-topbar, header');
  if (!topbar) return;

  const btn = document.createElement('button');
  btn.className = 'top-btn';
  btn.innerHTML = '📤 Enviar para revisión';
  btn.style.cssText = 'background:var(--accent);color:#fff;border:none;padding:0 14px;border-radius:6px;font-size:.78rem;cursor:pointer;font-weight:600';
  btn.onclick = () => submitBuilderProject();

  const saveBtn = topbar.querySelector('[onclick*="saveData"]');
  if (saveBtn) saveBtn.parentNode.insertBefore(btn, saveBtn.nextSibling);
  else topbar.appendChild(btn);
}

// ─── INIT ───
document.addEventListener('saqes:ready', async (e) => {
  const user = e.detail;
  if (!user) {
    // Si no está logueado, redirigir al index con mensaje
    toast('Inicia sesión para guardar en la nube.', 'warning');
    return;
  }
  window.SAQES_USER = user;

  // Cargar página si viene con ?pageId=
  if (_builderPageId) {
    await loadBuilderPage();
  }

  addSubmitButton();
});
