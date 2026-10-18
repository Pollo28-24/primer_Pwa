const CACHE_PREFIX = "coffee-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v15`;
const STATIC_DESTINATIONS = new Set([
  "font",
  "image",
  "manifest",
  "script",
  "style"
]);
const ASSETS_TO_CACHE = [
  "./index.html",
  "./detalle.html",
  "./js/app.js",
  "./js/pokemon.service.js",
  "./js/pokemon.ui.js",
  "./manifest.json",
  "./css/css-styles.css",
  "./imagenes/cafe1.png",
  "./imagenes/cafe2.png",
  "./imagenes/cafe3.png",
  "./imagenes/cafe4.png",
  "./imagenes/cafe5.png",
  "./imagenes/cafe6.png",
  "./imagenes/cafe7.png",
  "./imagenes/cafe8.png",
  "./imagenes/iconos/icon-72x72.png",
  "./imagenes/iconos/icon-96x96.png",
  "./imagenes/iconos/icon-128x128.png",
  "./imagenes/iconos/icon-144x144.png",
  "./imagenes/iconos/icon-152x152.png",
  "./imagenes/iconos/icon-192x192.png",
  "./imagenes/iconos/icon-384x384.png",
  "./imagenes/iconos/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) =>
            cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME
          )
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

function isCacheableResponse(request, response) {
  return response.ok &&
    response.type === "basic" &&
    new URL(request.url).origin === self.location.origin;
}

function cacheResponse(event, request, response) {
  if (isCacheableResponse(request, response)) {
    const cacheUpdate = caches.open(CACHE_NAME)
      .then((cache) => cache.put(request, response.clone()));

    event.waitUntil(
      cacheUpdate.catch((error) => {
        console.error("No se pudo guardar la respuesta en caché:", error);
      })
    );
  }

  return response;
}

function matchCache(request, options) {
  return caches.open(CACHE_NAME)
    .then((cache) => cache.match(request, options));
}

// 1. Cache First: entrega primero los recursos estáticos almacenados.
function cacheFirst(event, request) {
  return matchCache(request)
    .then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) =>
          cacheResponse(event, request, networkResponse)
        );
    });
}

// 2. Network First: intenta actualizar los documentos y usa la copia offline
//    solamente si falla la conexión.
function networkFirst(event, request) {
  return fetch(request)
    .then((networkResponse) =>
      cacheResponse(event, request, networkResponse)
    )
    .catch(async (networkError) => {
      const cachedResponse = await matchCache(request, {
        ignoreSearch: request.mode === "navigate"
      });
      if (cachedResponse) return cachedResponse;

      const requestURL = new URL(request.url);
      const scopeURL = new URL(self.registration.scope);
      if (
        request.mode === "navigate" &&
        requestURL.pathname === scopeURL.pathname
      ) {
        const indexURL = new URL("index.html", scopeURL);
        const cachedIndex = await matchCache(indexURL.href);
        if (cachedIndex) return cachedIndex;
      }

      throw networkError;
    });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const requestURL = new URL(request.url);
  const scopeURL = new URL(self.registration.scope);
  const isInScope = requestURL.origin === scopeURL.origin &&
    requestURL.pathname.startsWith(scopeURL.pathname);

  // Deja que el navegador gestione recursos externos, como Google Fonts.
  if (!isInScope) return;

  // Cache First va primero para recursos estáticos; las peticiones dinámicas
  // y las navegaciones pasan después por Network First.
  if (STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(cacheFirst(event, request));
    return;
  }

  // Network First se aplica después, únicamente a navegaciones HTML.
  event.respondWith(networkFirst(event, request));
});
