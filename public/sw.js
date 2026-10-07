const CACHE = 'nosso-sim-v2'
const ROOT = new URL('./', self.location.href).pathname
self.addEventListener('install', (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([ROOT, `${ROOT}manifest.webmanifest`, `${ROOT}icon.svg`])),
  ),
)
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  ),
)
self.addEventListener('fetch', (e) => {
  if (e.request.method === 'GET')
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
          return r
        })
        .catch(() => caches.match(e.request)),
    )
})
