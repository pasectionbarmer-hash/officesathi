// offline cache for Office Sathi v2.0.1 — files are processed on the device, nothing is uploaded
const CACHE = 'hps-2.0.1';
const FILES = ['./', 'index.html', 'adhikari.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // a file shared from WhatsApp etc. (manifest share_target): keep it in this phone's cache for the page; never sent anywhere
  if (e.request.method === 'POST' && u.origin === location.origin && u.pathname.endsWith('/share')) {
    e.respondWith((async () => {
      try {
        const f = (await e.request.formData()).getAll('file').find(x => x && typeof x !== 'string');
        if (f) await (await caches.open('os-share')).put(new URL('__shared__', self.registration.scope).href,
          new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-name': encodeURIComponent(f.name || 'file') } }));
      } catch (err) { /* nothing shared */ }
      return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // network first so a new version reaches people; the cache keeps it working offline
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
