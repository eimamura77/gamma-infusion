const files = {"./icon-192.png":"G+aYz9OK1fow3FDkbcofr/LfGom6XcGdzTDfNgnrzgo=","./icon-512.png":"kT/3KhTMR4YIjt5gZ32t+JcP29+OpYJCvDAMNCYZwT0=","./index.html":"JytupywLYQ7JxuSK0uNhAoeiYZRyfn9N87zjli2ZNnM=","./manifest.webmanifest":"iuNN3xnpptyn1CjseGkfgAkYHTdqf7kaebtCe9bJf5U=","./assets/index-BLAUZ6VX.css":"Lpq1/Q7KwTUG8ZVpCctbp1N0PAcU660EtrCJYtszbgw=","./assets/index-C51c7u32.js":"42Ky5jKNXvqZrWp8glRM5ejRQH6wnC+f/udYpRQlmH8="}
const prefix = 'gamma-infusion:' + self.registration.scope + ':'
const cacheName = prefix + 'fc9b56b1ee4b96112a8f'
const index = new URL('./index.html', self.registration.scope).href
const urls = Object.keys(files).map(
  (path) => new URL(path, self.registration.scope).href,
)
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName)
      await cache.addAll(
        Object.entries(files).map(
          ([path, hash]) =>
            new Request(new URL(path, self.registration.scope), {
              cache: 'reload',
              integrity: 'sha256-' + hash,
            }),
        ),
      )
    })(),
  )
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith(prefix) && key !== cacheName)
          await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const key = request.mode === 'navigate' ? index : request.url
  if (!urls.includes(key)) return
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName)
      const hit = await cache.match(key)
      if (hit) return hit
      const path = Object.keys(files)[urls.indexOf(key)]
      const response = await fetch(
        new Request(key, {
          integrity: 'sha256-' + files[path],
          cache: 'reload',
        }),
      )
      if (response.ok) await cache.put(key, response.clone())
      return response
    })(),
  )
})
self.addEventListener('message', (event) => {
  if (event.data !== 'verify') return
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(cacheName)
        const present = await Promise.all(urls.map((u) => cache.match(u)))
        event.ports[0].postMessage(present.every((r) => r?.ok))
      } catch {
        event.ports[0].postMessage(false)
      }
    })(),
  )
})
