/**
 * S-Reborn 클리닉 PWA — Cache-first: CSS/JS/폰트, Network-first: HTML(문서),
 * 네비게이션 실패 시 /offline/ 폴백 (오프라인 안내는 /offline.html → /offline/ 리다이렉트)
 */
const STATIC_CACHE = 'sreborn-static-v1';
const PAGE_CACHE = 'sreborn-pages-v1';
const OFFLINE_URL = '/offline/';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function sameOrigin(url, base) {
  try {
    return new URL(url, base).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isStaticAsset(request) {
  const d = request.destination;
  return d === 'style' || d === 'script' || d === 'font';
}

function isDocumentNavigation(request) {
  if (request.method !== 'GET') return false;
  if (request.mode === 'navigate') return true;
  if (request.destination === 'document') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!sameOrigin(request.url, self.location.origin)) return;

  if (isStaticAsset(request)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          const cache = await caches.open(STATIC_CACHE);
          try {
            await cache.put(request, copy);
          } catch {
            /* ignore quota / opaque */
          }
        }
        return response;
      })(),
    );
    return;
  }

  if (isDocumentNavigation(request)) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const copy = response.clone();
            const cache = await caches.open(PAGE_CACHE);
            try {
              await cache.put(request, copy);
            } catch {
              /* ignore */
            }
          }
          return response;
        } catch {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
          });
        }
      })(),
    );
  }
});
