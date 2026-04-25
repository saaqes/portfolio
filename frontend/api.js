/**
 * SAQES API Client
 * Reemplaza el uso de localStorage por llamadas reales al backend.
 * Incluir con: <script src="/api.js"></script>
 */

const API = (() => {
  const BASE = window.location.origin; // misma URL que el servidor

  // ── TOKEN ──
  function getToken() { return localStorage.getItem('saqes_token') || ''; }
  function setToken(t) { localStorage.setItem('saqes_token', t); }
  function clearToken() { localStorage.removeItem('saqes_token'); }

  // ── FETCH HELPER ──
  async function req(method, path, body, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && getToken()) headers['Authorization'] = `Bearer ${getToken()}`;
    const res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  }

  const get    = (path, auth)       => req('GET',    path, null, auth);
  const post   = (path, body, auth) => req('POST',   path, body, auth);
  const put    = (path, body, auth) => req('PUT',    path, body, auth);
  const del    = (path, auth)       => req('DELETE', path, null, auth);

  // ══════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════
  async function login(username, password) {
    const data = await post('/auth/login', { username, password }, false);
    setToken(data.token);
    return data.user;
  }

  async function register(username, email, password) {
    const data = await post('/auth/register', { username, email, password }, false);
    setToken(data.token);
    return data.user;
  }

  async function logout() {
    clearToken();
    // Limpiar estado local
    localStorage.removeItem('saqes_current_user');
  }

  async function me() {
    if (!getToken()) return null;
    try { return await get('/auth/me'); }
    catch { clearToken(); return null; }
  }

  // ══════════════════════════════════════
  // PUBLIC DATA (sin auth)
  // ══════════════════════════════════════
  const getStats        = ()  => get('/public/stats', false);
  const getSkills       = ()  => get('/public/skills', false);
  const getTrajectory   = ()  => get('/public/trajectory', false);
  const getTestimonials = ()  => get('/public/testimonials', false);
  const getContact      = ()  => get('/public/contact', false);
  const getSettings     = ()  => get('/public/settings', false);
  const getPublicProjects = () => get('/public/projects', false);
  const getPublicPage   = (username, slug) => get(`/public/pages/${username}/${slug}`, false);
  const sendMessage     = (body) => post('/public/contact-message', body, false);

  // ══════════════════════════════════════
  // PAGES (builder data — borradores)
  // ══════════════════════════════════════
  const getMyPages     = ()        => get('/pages');
  const getPage        = (id)      => get(`/pages/${id}`);
  const createPage     = (body)    => post('/pages', body);
  const updatePage     = (id, b)   => put(`/pages/${id}`, b);
  const deletePage     = (id)      => del(`/pages/${id}`);

  // ══════════════════════════════════════
  // PROJECTS (páginas enviadas a revisión)
  // ══════════════════════════════════════
  const getMyProjects  = ()        => get('/projects');
  const getProject     = (id)      => get(`/projects/${id}`);
  const createProject  = (body)    => post('/projects', body);
  const updateProject  = (id, b)   => put(`/projects/${id}`, b);
  const submitProject  = (id, msg) => post(`/projects/${id}/submit`, { mensaje_usuario: msg });
  const deleteProject  = (id)      => del(`/projects/${id}`);

  // ══════════════════════════════════════
  // PROFILE
  // ══════════════════════════════════════
  const getProfile     = (username) => get(`/profile/${username}`, false);
  const updateProfile  = (body)     => put('/profile', body);
  const updateBanner   = (body)     => put('/profile/banner', body);

  // ══════════════════════════════════════
  // ADMIN
  // ══════════════════════════════════════
  const adminStats          = ()        => get('/admin/stats');
  const adminGetSettings    = ()        => get('/admin/settings');
  const adminSaveSettings   = (b)       => put('/admin/settings', b);
  const adminSaveProfile    = (b)       => put('/admin/profile', b);
  const adminUpdateContact  = (b)       => put('/admin/contact', b);

  const adminGetSkills      = ()        => get('/admin/skills');
  const adminAddSkill       = (b)       => post('/admin/skills', b);
  const adminUpdateSkill    = (id, b)   => put(`/admin/skills/${id}`, b);
  const adminDeleteSkill    = (id)      => del(`/admin/skills/${id}`);

  const adminGetTrajectory  = ()        => get('/admin/trajectory');
  const adminAddTrajectory  = (b)       => post('/admin/trajectory', b);
  const adminUpdateTrajectory=(id,b)    => put(`/admin/trajectory/${id}`, b);
  const adminDeleteTrajectory=(id)      => del(`/admin/trajectory/${id}`);

  const adminGetTestimonials = ()       => get('/admin/testimonials');
  const adminAddTestimonial  = (b)      => post('/admin/testimonials', b);
  const adminUpdateTestimonial=(id,b)   => put(`/admin/testimonials/${id}`, b);
  const adminDeleteTestimonial=(id)     => del(`/admin/testimonials/${id}`);

  const adminGetUsers        = ()       => get('/admin/users');
  const adminDeleteUser      = (id)     => del(`/admin/users/${id}`);

  const adminGetProjects     = (estado) => get(`/admin/projects${estado ? '?estado='+estado : ''}`);
  const adminReviewProject   = (id, b)  => put(`/admin/projects/${id}/review`, b);

  const adminGetMessages     = ()       => get('/admin/messages');
  const adminMarkMessageRead = (id)     => put(`/admin/messages/${id}/read`, {});
  const adminDeleteMessage   = (id)     => del(`/admin/messages/${id}`);

  const adminGetNotifications = ()      => get('/admin/notifications');
  const adminMarkNotifRead    = (id)    => put(`/admin/notifications/${id}/read`, {});
  const adminReadAllNotifs    = ()      => put('/admin/notifications/read-all', {});

  const adminUpdateStats      = (b)     => put('/admin/stats', b);

  // ══════════════════════════════════════
  // UTILIDADES
  // ══════════════════════════════════════

  // Inicializar: cargar usuario si hay token
  async function init() {
    const user = await me();
    if (user) {
      window.SAQES_USER = user;
      document.dispatchEvent(new CustomEvent('saqes:userLoaded', { detail: user }));
    }
    document.dispatchEvent(new CustomEvent('saqes:ready', { detail: user }));
    return user;
  }

  return {
    // Auth
    login, register, logout, me, getToken, init,
    // Public
    getStats, getSkills, getTrajectory, getTestimonials,
    getContact, getSettings, getPublicProjects, getPublicPage, sendMessage,
    // Pages (builder)
    getMyPages, getPage, createPage, updatePage, deletePage,
    // Projects
    getMyProjects, getProject, createProject, updateProject, submitProject, deleteProject,
    // Profile
    getProfile, updateProfile, updateBanner,
    // Admin
    adminStats, adminGetSettings, adminSaveSettings, adminSaveProfile, adminUpdateContact,
    adminGetSkills, adminAddSkill, adminUpdateSkill, adminDeleteSkill,
    adminGetTrajectory, adminAddTrajectory, adminUpdateTrajectory, adminDeleteTrajectory,
    adminGetTestimonials, adminAddTestimonial, adminUpdateTestimonial, adminDeleteTestimonial,
    adminGetUsers, adminDeleteUser,
    adminGetProjects, adminReviewProject,
    adminGetMessages, adminMarkMessageRead, adminDeleteMessage,
    adminGetNotifications, adminMarkNotifRead, adminReadAllNotifs,
    adminUpdateStats,
  };
})();

// Auto-init cuando el DOM cargue
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => API.init());
} else {
  API.init();
}
