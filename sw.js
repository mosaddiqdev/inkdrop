/**
 * Service Worker for inkdrop PWA
 * Implements intelligent caching strategies for optimal offline experience
 */

// Cache versioning for proper cache invalidation during updates
const CACHE_VERSION = '2025.1.0';
const STATIC_CACHE = `inkdrop-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `inkdrop-dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `inkdrop-offline-${CACHE_VERSION}`;

// Critical files that must be cached for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/app.css',
  '/src/app.js',
  '/assets/icons/favicon.svg',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
  '/app.manifest.json',
  '/browserconfig.xml'
];

// Caching strategies for different types of resources
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',        // Static assets - serve from cache, fallback to network
  NETWORK_FIRST: 'network-first',    // Dynamic content - try network first, fallback to cache
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'  // Serve from cache, update in background
};
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        if (self.location.hostname === 'localhost') {
          console.log('Caching static files');
        }
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        if (self.location.hostname === 'localhost') {
          console.log('Service worker installed');
        }
        return self.skipWaiting();
      })
      .catch((error) => {
        if (self.location.hostname === 'localhost') {
          console.error('Failed to install service worker:', error);
        }
      })
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes(CACHE_VERSION)) {
              if (self.location.hostname === 'localhost') {
                console.log('Deleting old cache:', cacheName);
              }
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      if (self.location.hostname === 'localhost') {
        console.log('Service worker activated and claimed clients');
      }
    }).catch((error) => {
      if (self.location.hostname === 'localhost') {
        console.error('Service worker activation failed:', error);
      }
    })
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  if (!event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('chrome-extension')) {
    return;
  }
  const url = new URL(event.request.url);
  if (STATIC_FILES.includes(url.pathname) || url.pathname.endsWith('.svg')) {
    event.respondWith(cacheFirst(event.request));
  } else if (url.pathname === '/' || url.pathname.includes('index.html')) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
/**
 * Cache-first strategy for static assets
 * Serves from cache immediately, updates cache from network if needed
 * Ideal for CSS, JS, and other static files that rarely change
 */
async function cacheFirst(request) {
  try {
    // Check cache first for instant loading
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network if not in cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses for future use
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (self.location.hostname === 'localhost') {
      console.log('Cache-first failed:', error);
    }
    return caches.match('/index.html');
  }
}
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (self.location.hostname === 'localhost') {
      console.log('Network-first fallback to cache:', error);
    }
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/index.html');
  }
}
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  return cachedResponse || fetchPromise;
}
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(
      Promise.resolve().then(() => {
        if (self.location.hostname === 'localhost') {
          console.log('Background sync triggered');
        }
      })
    );
  }
});
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Open inkdrop',
          icon: '/favicon.svg'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
