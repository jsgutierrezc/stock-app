const CACHE = 'visioncolor-v1'
const ASSETS = [
    './',
    'index.html',
    'style.css',
    'color.js',
    'app.js',
    'manifest.json',
    'icons/icon.svg',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-maskable-512.png',
    'icons/apple-touch-icon-180.png',
]

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches
            .open(CACHE)
            .then((c) => c.addAll(ASSETS))
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
            )
            .then(() => self.clients.claim())
    )
})

// Stale-while-revalidate: respond from cache, refresh in background.
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return
    e.respondWith(
        caches.match(e.request).then((cached) => {
            const network = fetch(e.request)
                .then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone()
                        caches.open(CACHE).then((c) => c.put(e.request, copy))
                    }
                    return res
                })
                .catch(() => cached)
            return cached || network
        })
    )
})
