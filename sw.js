// 軍棋大師 離線快取：更新遊戲時把版本號 +1
const CACHE = 'hexwar-v10.2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // params.json：網路優先（更新平衡只要上傳 params.json），離線時用上次的快取
  const url = new URL(e.request.url);
  if (url.origin === location.origin && url.pathname.endsWith('/params.json')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./params.json', copy)); }
      return res;
    }).catch(() => caches.match('./params.json')));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit ||
      fetch(e.request).then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
  );
});
