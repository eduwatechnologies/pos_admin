const CACHE_NAME = 'kounter-pos-admin-v1'

const STATIC_ASSETS = [
  '/',
  '/_next/static/css/*.css',
  '/_next/static/js/*.js',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests and non-http(s) requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) return

  // Skip Next.js internal requests and API calls
  if (
    request.url.includes('/_next/') ||
    request.url.includes('/api/') ||
    request.url.includes('uploadthing')
  ) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-ok responses
          if (!response || response.status !== 200) {
            return response
          }

          // Clone and cache the response
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline fallback if available
          return caches.match('/')
        })
    })
  )
})