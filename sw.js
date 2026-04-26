const CACHE = 'brief-web-v1';
const STATIC = ['/', '/index.html', '/admin.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATIONS ───────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'Nuevo Brief', body: 'Se recibió un nuevo formulario', icon: '/icon-192.png' };
  try { data = { ...data, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon || '/icon-192.png',
      badge:   '/icon-192.png',
      vibrate: [200, 100, 200],
      tag:     'nuevo-brief',
      data:    data,
      actions: [
        { action: 'ver', title: '👀 Ver en Admin' },
        { action: 'cerrar', title: 'Cerrar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'ver' || !e.action) {
    e.waitUntil(
      clients.matchAll({ type: 'window' }).then(list => {
        const adminUrl = self.location.origin + '/admin';
        const existing = list.find(c => c.url.includes('/admin'));
        if (existing) { existing.focus(); return; }
        clients.openWindow(adminUrl);
      })
    );
  }
});
