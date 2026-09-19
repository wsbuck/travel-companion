// Yalla Jordan Phrasebook service worker.
// App shell is cache-first; Google Fonts are cached on first use. Bump VERSION when index.html changes.
const VERSION = "v9";
const SHELL = `yalla-shell-${VERSION}`;
const FONTS = "yalla-fonts";
const SHELL_FILES = ["./", "./index.html", "./manifest.json", "./icon-v4-192.png", "./icon-v4-512.png", "./icon-v4-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("yalla-shell-") && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin === location.origin) {
    // Shell: serve from cache, refresh in the background so the next open gets updates.
    e.respondWith(caches.open(SHELL).then(async c => {
      const cached = await c.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => cached);
      return cached || net;
    }));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const cached = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => cached);
      return cached || net;
    }));
  }
});
