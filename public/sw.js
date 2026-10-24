// Keeps the field entry page and the app's static files available offline. Nothing else is cached.
const CACHE = 'mpingo-shell-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (req.mode === 'navigate' && url.pathname === '/field') {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('/field', copy)); }
      return res;
    }).catch(async () => (await caches.match('/field')) || new Response('You are offline, and this page has not been opened on this device before. Open it once while online.', { status: 503, headers: { 'Content-Type': 'text/plain' } })));
  }
});
