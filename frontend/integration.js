/**
 * SAQES Integration Layer
 * Reemplaza handleLogin, handleRegister, populateProfile, populateAdmin, 
 * renderProjects, etc. con versiones que usan la API real.
 * Se carga DESPUÉS del script inline del index.html.
 */

// ═══════════════════════════════════════════════════════
// OVERRIDE: LOGIN
// ═══════════════════════════════════════════════════════
window.handleLogin = async function () {
  const username = document.getElementById('login-user')?.value?.trim();
  const pass     = document.getElementById('login-pass')?.value;
  if (!username) { showError('err-login-user','login-user'); return; }
  if (!pass)     { showError('err-login-pass','login-pass'); return; }

  try {
    const user = await API.login(username, pass);
    window.SAQES_USER = user;
    loginUserUI(user);
    closeModal('login-modal');
    showToast('¡Bienvenido, ' + user.username + '!');
  } catch (e) {
    const errEl = document.getElementById('err-login-creds');
    if (errEl) errEl.classList.add('show');
    document.getElementById('login-pass')?.classList.add('error');
  }
};

// ═══════════════════════════════════════════════════════
// OVERRIDE: REGISTER
// ═══════════════════════════════════════════════════════
window.handleRegister = async function () {
  const u  = document.getElementById('reg-user')?.value?.trim();
  const e  = document.getElementById('reg-email')?.value?.trim();
  const p  = document.getElementById('reg-pass')?.value;
  const p2 = document.getElementById('reg-pass2')?.value;

  if (!u)      { showError('err-reg-user','reg-user'); return; }
  if (!e)      { showError('err-reg-email','reg-email'); return; }
  if (!p)      { showError('err-reg-pass','reg-pass'); return; }
  if (p !== p2){ showError('err-reg-match','reg-pass2'); return; }

  try {
    const user = await API.register(u, e, p);
    window.SAQES_USER = user;
    loginUserUI(user);
    closeModal('login-modal');
    showToast('¡Cuenta creada! Bienvenido, ' + user.username + '!');
  } catch (err) {
    const errEl = document.getElementById('err-reg-user');
    if (errEl) { errEl.textContent = err.error || 'Error al registrar.'; errEl.classList.add('show'); }
  }
};

// ═══════════════════════════════════════════════════════
// OVERRIDE: LOGOUT
// ═══════════════════════════════════════════════════════
window.logout = async function () {
  await API.logout();
  window.SAQES_USER = null;
  // Reset nav
  const loginBtn  = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userChip  = document.getElementById('user-chip');
  if (loginBtn)  loginBtn.style.display = '';
  if (logoutBtn) logoutBtn.style.display = 'none';
  if (userChip)  userChip.style.display  = 'none';
  goTo('home');
  showProfileMobile && showProfileMobile(false);
  showToast('Sesión cerrada.');
};

// ─── UI helper tras login exitoso ───
function loginUserUI(user) {
  const loginBtn  = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userChip  = document.getElementById('user-chip');
  const navAvatar = document.getElementById('nav-avatar');

  if (loginBtn)  loginBtn.style.display  = 'none';
  if (logoutBtn) logoutBtn.style.display = 'block';

  if (userChip) {
    userChip.style.display = 'flex';
    userChip.onclick = () => goToWrapped ? goToWrapped('profile') : goTo('profile');
  }
  if (navAvatar) {
    navAvatar.src = user.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}&backgroundColor=8a2be2`;
  }

  // Actualizar hero banner
  const avatarCircle = document.querySelector('.hcb-avatar-circle');
  if (avatarCircle && user.avatar) {
    avatarCircle.innerHTML = `<img src="${user.avatar}" alt="${user.username}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  }

  // Actualizar nav admin
  const adminNavBtn = document.getElementById('admin-nav-btn');
  if (adminNavBtn) adminNavBtn.style.display = user.role === 'admin' ? 'inline-block' : 'none';

  renderProjects();
  renderRepoTeaser();
}

// ═══════════════════════════════════════════════════════
// OVERRIDE: RENDER PROJECTS (portafolio público)
// ═══════════════════════════════════════════════════════
window.renderProjects = async function () {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  try {
    const projects = await API.getPublicProjects();
    if (!projects.length) {
      grid.innerHTML = `<p style="color:#555;font-size:.85rem;grid-column:1/-1">Sin proyectos aprobados aún.</p>`;
      return;
    }
    grid.innerHTML = projects.map(p => `
      <div class="card stagger-item">
        ${p.thumbnail
          ? `<div class="preview-img" style="background-image:url(${p.thumbnail})"></div>`
          : `<div class="preview-img preview-empty">🖼</div>`}
        <h3>${p.nombre}</h3>
        <p>${p.descripcion || ''}</p>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:5px">
          ${(p.tags || []).map(t => `<span class="card-tag">${t}</span>`).join('')}
        </div>
        ${p.preview_url ? `<a href="${p.preview_url}" target="_blank" class="card-open-btn">Ver proyecto →</a>` : ''}
      </div>
    `).join('');
    setupAnimations();
  } catch (e) {
    console.warn('renderProjects error:', e);
  }
};

// ═══════════════════════════════════════════════════════
// OVERRIDE: RENDER REPO TEASER (páginas públicas del builder)
// ═══════════════════════════════════════════════════════
window.renderRepoTeaser = async function () {
  const grid = document.getElementById('repo-teaser-grid');
  if (!grid) return;

  try {
    const user = window.SAQES_USER;
    if (!user) { grid.innerHTML = `<p style="color:#555;font-size:.85rem">Inicia sesión para ver tus páginas.</p>`; return; }

    const pages = await API.getMyPages();
    const slice = pages.slice(0, 3);
    if (!slice.length) {
      grid.innerHTML = `<p style="color:#555;font-size:.85rem">Aún no tienes páginas. <a href="/builder.html" style="color:var(--purple)">¡Crea la primera!</a></p>`;
      return;
    }
    grid.innerHTML = slice.map(p => repoCardHtml(p)).join('');
    setupAnimations();
  } catch (e) { console.warn('repoTeaser:', e); }
};

// ═══════════════════════════════════════════════════════
// OVERRIDE: RENDER REPO FULL
// ═══════════════════════════════════════════════════════
window.renderRepoFull = async function (filter) {
  const grid = document.getElementById('repo-full-grid');
  if (!grid) return;

  try {
    const user = window.SAQES_USER;
    if (!user) {
      grid.innerHTML = `<p style="color:#555">Inicia sesión para ver tu repositorio.</p>`;
      return;
    }
    let pages = await API.getMyPages();
    if (filter && filter !== 'all') pages = pages.filter(p => p.is_public ? filter === 'public' : filter === 'draft');
    grid.innerHTML = pages.length ? pages.map(p => repoCardHtml(p)).join('') :
      `<p style="color:#555;font-size:.85rem">Sin páginas con este filtro.</p>`;
    setupAnimations();
  } catch (e) { console.warn('repoFull:', e); }
};

function repoCardHtml(p) {
  const user = window.SAQES_USER;
  return `
    <div class="repo-card stagger-item" onclick="openInBuilder(${p.id})">
      ${p.thumbnail
        ? `<div style="width:100%;height:140px;background:url(${p.thumbnail}) center/cover;border-radius:6px 6px 0 0;margin-bottom:10px"></div>`
        : `<div style="width:100%;height:80px;background:#111;border-radius:6px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#333">📄</div>`}
      <div style="font-family:'Bungee',cursive;font-size:.9rem;color:var(--white);margin-bottom:4px">${p.nombre}</div>
      <div style="font-size:.65rem;color:#555;margin-bottom:10px">${new Date(p.updated_at).toLocaleDateString('es-CO')}</div>
      <div style="display:flex;gap:6px">
        <a href="/builder.html?pageId=${p.id}" class="card-open-btn" onclick="event.stopPropagation()">✏ Editar</a>
        <button class="card-open-btn" onclick="event.stopPropagation();deletePageUI(${p.id})">🗑</button>
        <button class="card-open-btn" onclick="event.stopPropagation();submitPageUI(${p.id})" style="border-color:#ff9f00;color:#ff9f00">📤 Enviar</button>
      </div>
    </div>`;
}

window.openInBuilder = function (pageId) {
  window.location.href = `/builder.html?pageId=${pageId}`;
};

window.deletePageUI = async function (id) {
  if (!confirm('¿Eliminar esta página?')) return;
  try {
    await API.deletePage(id);
    showToast('Página eliminada.');
    renderRepoFull();
    renderRepoTeaser();
  } catch (e) { showToast('Error al eliminar.', 'error'); }
};

window.submitPageUI = async function (id) {
  const msg = prompt('Mensaje adicional para el admin (opcional):');
  try {
    await API.submitProject(id, msg || '');
    showToast('✅ Proyecto enviado para revisión.');
  } catch (e) { showToast(e.error || 'Error al enviar.', 'error'); }
};

// ═══════════════════════════════════════════════════════
// OVERRIDE: POPULATE PROFILE
// ═══════════════════════════════════════════════════════
window.populateProfile = async function () {
  const user = window.SAQES_USER;
  if (!user) return;

  // Datos del perfil desde la API
  try {
    const profile = await API.getProfile(user.username);
    const u = profile.user;

    // Banner
    applyBannerDOM(u.banner_grad, u.banner_img);

    // Nombre y bio
    const nameEl  = document.getElementById('prof-name');
    const bioEl   = document.getElementById('prof-bio');
    const locEl   = document.getElementById('prof-loc');
    const roleEl  = document.getElementById('prof-role');
    const avatarEl = document.getElementById('prof-avatar');

    if (nameEl)   nameEl.textContent  = '@' + u.username;
    if (bioEl)    bioEl.textContent   = u.bio || '';
    if (locEl)    locEl.textContent   = u.location || '';
    if (roleEl)   roleEl.textContent  = u.role === 'admin' ? '⚡ Admin / Master' : '✍ Writer';
    if (avatarEl && u.avatar) avatarEl.src = u.avatar;

    // Botón perfil
    const btnEl = document.getElementById('prof-cta-btn');
    if (btnEl) {
      btnEl.textContent = u.btn_text || '+ Crear Página';
      btnEl.style.background = u.btn_color || 'var(--purple)';
      btnEl.onclick = () => window.location.href = u.btn_link || '/builder.html';
    }

    // Páginas
    renderPagesGrid(profile.pages || []);

    // Proyectos enviados
    renderProjectsGrid(profile.projects || []);

  } catch (e) { console.warn('populateProfile error:', e); }
};

function renderPagesGrid(pages) {
  const grid = document.getElementById('pages-grid');
  if (!grid) return;
  if (!pages.length) {
    grid.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#555">
      <div style="font-size:3rem;opacity:.2">📄</div>
      <p style="margin:10px 0">No tienes páginas aún.</p>
      <a href="/builder.html" class="btn-cta" style="font-size:.9rem;padding:12px 24px;display:inline-block;margin-top:10px">+ Crear página</a>
    </div>`;
    return;
  }
  grid.innerHTML = pages.map(p => `
    <div class="page-card">
      ${p.thumbnail
        ? `<div style="width:100%;height:130px;background:url(${p.thumbnail}) center/cover"></div>`
        : `<div style="width:100%;height:80px;background:#111;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#333">📄</div>`}
      <div style="padding:14px">
        <div style="font-family:'Bungee',cursive;font-size:.9rem;color:var(--white);margin-bottom:4px">${p.nombre}</div>
        <div style="font-size:.65rem;color:#555;margin-bottom:10px">${new Date(p.updated_at||p.created_at).toLocaleDateString('es-CO')}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <a href="/builder.html?pageId=${p.id}" class="card-open-btn">✏ Editar</a>
          <button class="card-open-btn" onclick="deletePageUI(${p.id})">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

function renderProjectsGrid(projects) {
  const grid = document.getElementById('projects-sent-grid');
  if (!grid) return;
  grid.innerHTML = projects.map(p => `
    <div class="page-card">
      <div style="padding:14px">
        <div style="font-family:'Bungee',cursive;font-size:.9rem;color:var(--white)">${p.nombre}</div>
        <div style="font-size:.65rem;margin:4px 0 8px;padding:3px 8px;border-radius:20px;display:inline-block;
          background:${p.estado==='aprobado'?'rgba(34,197,94,.2)':p.estado==='rechazado'?'rgba(239,68,68,.2)':'rgba(251,191,36,.2)'};
          color:${p.estado==='aprobado'?'#4ade80':p.estado==='rechazado'?'#f87171':'#fbbf24'}">
          ${p.estado}
        </div>
        ${p.feedback_admin ? `<p style="font-size:.72rem;color:#666;margin-top:6px">Admin: ${p.feedback_admin}</p>` : ''}
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════
// OVERRIDE: POPULATE ADMIN
// ═══════════════════════════════════════════════════════
window.populateAdmin = async function () {
  const user = window.SAQES_USER;
  if (!user || user.role !== 'admin') return;

  try {
    const [stats, settings, notifications, pendingProjects, messages] = await Promise.all([
      API.adminStats(),
      API.adminGetSettings(),
      API.adminGetNotifications(),
      API.adminGetProjects('enviado'),
      API.adminGetMessages(),
    ]);

    // Stats cards
    _setAdminEl('admin-stat-users',    stats.real_users);
    _setAdminEl('admin-stat-pages',    stats.real_pages);
    _setAdminEl('admin-stat-projects', stats.real_projects);
    _setAdminEl('admin-stat-msgs',     stats.unread_messages);
    _setAdminEl('admin-notif-count',   stats.unread_notifications);

    // Configuración
    const titleIn = document.getElementById('admin-hero-title');
    const subIn   = document.getElementById('admin-hero-sub');
    const ctaIn   = document.getElementById('admin-hero-cta');
    if (titleIn) titleIn.value = settings.hero_title || '';
    if (subIn)   subIn.value   = settings.hero_subtitle || '';
    if (ctaIn)   ctaIn.value   = settings.hero_cta || '';

    // Proyectos pendientes de revisión
    const reviewGrid = document.getElementById('admin-review-grid');
    if (reviewGrid) {
      reviewGrid.innerHTML = pendingProjects.length
        ? pendingProjects.map(p => `
          <div class="admin-project-card" style="background:#111;border:1px solid #222;padding:16px;border-radius:6px;margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
              <div>
                <div style="font-family:'Bungee',cursive;font-size:.9rem">${p.nombre}</div>
                <div style="font-size:.72rem;color:#888">@${p.username} · ${new Date(p.updated_at).toLocaleDateString('es-CO')}</div>
                ${p.mensaje_usuario ? `<div style="font-size:.75rem;color:#aaa;margin-top:4px;background:#1a1a1a;padding:6px 10px;border-radius:4px">"${p.mensaje_usuario}"</div>` : ''}
              </div>
              <div style="display:flex;gap:8px">
                ${p.preview_url ? `<a href="${p.preview_url}" target="_blank" class="card-open-btn">👁 Ver</a>` : ''}
                <button class="card-open-btn" style="border-color:#4ade80;color:#4ade80" onclick="reviewProject(${p.id},'aprobado')">✓ Aprobar</button>
                <button class="card-open-btn" style="border-color:#f87171;color:#f87171" onclick="reviewProject(${p.id},'rechazado')">✕ Rechazar</button>
              </div>
            </div>
          </div>`).join('')
        : `<p style="color:#555;font-size:.85rem">Sin proyectos pendientes.</p>`;
    }

    // Mensajes
    const msgsEl = document.getElementById('admin-messages-list');
    if (msgsEl) {
      msgsEl.innerHTML = messages.length
        ? messages.slice(0, 10).map(m => `
          <div style="background:#111;border:1px solid ${m.read ? '#222' : 'var(--purple)'};padding:14px;border-radius:4px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
              <div>
                <div style="font-size:.85rem;font-weight:600">${m.name} <span style="color:#666;font-size:.75rem">— ${m.email}</span></div>
                <div style="color:#999;font-size:.82rem;margin-top:4px">${m.message}</div>
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0">
                ${!m.read ? `<button class="card-open-btn" style="font-size:.65rem" onclick="markMsgRead(${m.id},this)">✓</button>` : ''}
                <button class="card-open-btn danger" style="font-size:.65rem;border-color:#f87171;color:#f87171" onclick="deleteMsgUI(${m.id},this)">🗑</button>
              </div>
            </div>
          </div>`).join('')
        : `<p style="color:#555;font-size:.85rem">Sin mensajes.</p>`;
    }

    // Notificaciones
    const notifEl = document.getElementById('admin-notifs-list');
    if (notifEl) {
      notifEl.innerHTML = notifications.slice(0, 15).map(n => `
        <div style="padding:10px;border-bottom:1px solid #1a1a1a;opacity:${n.leido ? '.5' : '1'}">
          <div style="font-size:.82rem;font-weight:600">${n.titulo}</div>
          <div style="font-size:.72rem;color:#666">${n.descripcion}</div>
        </div>`).join('') || `<p style="color:#555;font-size:.85rem">Sin notificaciones.</p>`;
    }

    // Usuarios
    const usersEl = document.getElementById('users-list');
    if (usersEl) {
      const users = await API.adminGetUsers();
      usersEl.innerHTML = users.map(u => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a1a1a">
          <div>
            <span style="font-weight:600">@${u.username}</span>
            <span style="color:#555;font-size:.75rem;margin-left:8px">${u.email}</span>
            <span style="color:#888;font-size:.7rem;margin-left:8px">${u.page_count} páginas</span>
          </div>
          ${u.role !== 'admin'
            ? `<button class="card-open-btn" style="font-size:.65rem;border-color:#f87171;color:#f87171;padding:4px 8px" onclick="deleteUserUI(${u.id},'${u.username}')">🗑</button>`
            : `<span style="color:var(--orange);font-size:.7rem">admin</span>`}
        </div>`).join('');
    }

  } catch (e) { console.error('populateAdmin error:', e); }
};

function _setAdminEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '—';
}

// ═══════════════════════════════════════════════════════
// ADMIN ACTIONS
// ═══════════════════════════════════════════════════════
window.applyHeroChanges = async function () {
  const title = document.getElementById('admin-hero-title')?.value;
  const sub   = document.getElementById('admin-hero-sub')?.value;
  const cta   = document.getElementById('admin-hero-cta')?.value;
  try {
    await API.adminSaveSettings({ hero_title: title, hero_subtitle: sub, hero_cta: cta });
    showToast('✓ Hero actualizado');
  } catch (e) { showToast('Error.'); }
};

window.applyAppearance = async function () {
  const primary = document.getElementById('color-primary')?.value;
  const accent  = document.getElementById('color-accent')?.value;
  if (primary) { document.documentElement.style.setProperty('--purple', primary); }
  if (accent)  { document.documentElement.style.setProperty('--neon-pink', accent); }
  try {
    await API.adminSaveSettings({ primary_color: primary, accent_color: accent });
    showToast('✓ Colores aplicados');
  } catch (e) { showToast('Error.'); }
};

window.reviewProject = async function (id, estado) {
  const feedback = estado === 'rechazado' ? prompt('Razón del rechazo (opcional):') : null;
  try {
    await API.adminReviewProject(id, { estado, feedback_admin: feedback || '' });
    showToast(`✓ Proyecto ${estado}`);
    populateAdmin();
  } catch (e) { showToast('Error.'); }
};

window.markMsgRead = async function (id, btn) {
  try { await API.adminMarkMessageRead(id); btn.parentElement.remove(); } catch (e) {}
};

window.deleteMsgUI = async function (id, btn) {
  try { await API.adminDeleteMessage(id); btn.closest('div[style]').remove(); } catch (e) {}
};

window.deleteUserUI = async function (id, username) {
  if (!confirm(`¿Eliminar usuario @${username}?`)) return;
  try { await API.adminDeleteUser(id); showToast('Usuario eliminado.'); populateAdmin(); }
  catch (e) { showToast(e.error || 'Error.'); }
};

window.saveProfileEdit = async function () {
  const bio      = document.getElementById('edit-bio')?.value;
  const location = document.getElementById('edit-location')?.value;
  const avatar   = document.getElementById('edit-avatar-url')?.value ||
                   document.getElementById('edit-avatar-preview')?.src || '';
  try {
    const updated = await API.updateProfile({ bio, location, avatar });
    window.SAQES_USER = { ...window.SAQES_USER, ...updated };
    closeModal('edit-profile-modal');
    populateProfile();
    showToast('✓ Perfil actualizado');
  } catch (e) { showToast('Error al guardar.'); }
};

window.saveBannerAdmin = async function () {
  const grad = window._selectedGrad || window.SAQES_USER?.banner_grad || '';
  const img  = document.getElementById('admin-banner-img-preview')?.src || '';
  try {
    await API.adminSaveProfile({ banner_grad: grad, banner_img: img });
    showToast('✓ Banner guardado');
    populateAdmin();
  } catch (e) { showToast('Error.'); }
};

// ═══════════════════════════════════════════════════════
// LOAD SITE DATA (stats, skills, trajectory, testimonials)
// ═══════════════════════════════════════════════════════
async function loadSiteData() {
  try {
    const [stats, skills, traj, testimonials, settings, contact] = await Promise.all([
      API.getStats(),
      API.getSkills(),
      API.getTrajectory(),
      API.getTestimonials(),
      API.getSettings(),
      API.getContact(),
    ]);

    // Colores desde settings
    if (settings.primary_color) document.documentElement.style.setProperty('--purple', settings.primary_color);
    if (settings.accent_color)  document.documentElement.style.setProperty('--neon-pink', settings.accent_color);

    // Stats counters
    const statEls = {
      'stat-projects': stats.proyectos_creados || stats.real_projects || 0,
      'stat-users':    stats.usuarios_activos  || stats.real_users    || 0,
      'stat-pages':    stats.paginas_publicadas|| stats.real_pages    || 0,
      'stat-years':    stats.anos_experiencia  || 3,
    };
    Object.entries(statEls).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) countUp(el, val);
    });

    // Skills
    const skillsGrid = document.getElementById('skills-grid-inner');
    if (skillsGrid && skills.length) {
      skillsGrid.innerHTML = skills.map(s => `
        <div class="skill-card stagger-item" style="--pct:${s.nivel}%">
          <span class="skill-icon">${s.icono || '⚡'}</span>
          <div class="skill-name">${s.nombre}</div>
          <div class="skill-bar-wrap"><div class="skill-bar" data-pct="${s.nivel}"></div></div>
        </div>`).join('');
    }

    // Timeline
    const timelineEl = document.getElementById('timeline-inner');
    if (timelineEl && traj.length) {
      timelineEl.innerHTML = traj.map(t => `
        <div class="tl-item stagger-item">
          <div class="tl-year">${t.fecha}</div>
          <div class="tl-title">${t.titulo}</div>
          <div class="tl-desc">${t.descripcion}</div>
        </div>`).join('');
    }

    // Testimonials
    const testGrid = document.getElementById('testimonials-grid');
    if (testGrid && testimonials.length) {
      testGrid.innerHTML = testimonials.map(t => `
        <div class="testimonial stagger-item">
          <p class="test-text">"${t.comentario}"</p>
          <div class="test-author">
            <div class="test-avatar">${t.imagen ? `<img src="${t.imagen}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : '👤'}</div>
            <div>
              <div class="test-name">${t.nombre}</div>
              <div class="test-role">${t.rol}</div>
            </div>
          </div>
        </div>`).join('');
    }

    // Contact info
    const emailEl = document.getElementById('contact-email-val');
    const telEl   = document.getElementById('contact-tel-val');
    if (emailEl && contact.email) emailEl.textContent = contact.email;
    if (telEl   && contact.telefono) telEl.textContent = contact.telefono;

    setTimeout(setupAnimations, 200);
  } catch (e) { console.warn('loadSiteData error:', e); }
}

// ═══════════════════════════════════════════════════════
// CONTACT FORM
// ═══════════════════════════════════════════════════════
window.handleContactForm = async function () {
  const name    = document.getElementById('contact-name')?.value?.trim();
  const email   = document.getElementById('contact-email-inp')?.value?.trim();
  const message = document.getElementById('contact-msg')?.value?.trim();
  if (!name || !email || !message) { showToast('Completa todos los campos.'); return; }
  try {
    await API.sendMessage({ name, email, message });
    showToast('✅ Mensaje enviado. Gracias!');
    ['contact-name','contact-email-inp','contact-msg'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
  } catch (e) { showToast('Error al enviar.'); }
};

// ═══════════════════════════════════════════════════════
// INIT — cuando la API indica que está lista
// ═══════════════════════════════════════════════════════
document.addEventListener('saqes:ready', async (e) => {
  const user = e.detail;

  // Cargar datos públicos del sitio
  await loadSiteData();

  // Si hay usuario logueado
  if (user) {
    loginUserUI(user);
    // Si está en la vista de profile o admin, cargarlas
    const activeView = document.querySelector('.view.active')?.id;
    if (activeView === 'view-profile') populateProfile();
    if (activeView === 'view-admin' && user.role === 'admin') populateAdmin();
  }

  // Renderizar contenido home
  await renderProjects();
  await renderRepoTeaser();
});
