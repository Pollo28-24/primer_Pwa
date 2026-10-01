const CACHE_NAME = "coffee-pwa-v12";
const ASSETS_TO_CACHE = [
  "./index.html",
  "./detalle.html",
  "./app.js",
  "./manifest.json",
  "../css/css-styles.css",
  "../imagenes/cafe1.png",
  "../imagenes/cafe2.png",
  "../imagenes/cafe3.png",
  "../imagenes/cafe4.png",  
  "../imagenes/cafe5.png",
  "../imagenes/cafe6.png",
  "../imagenes/cafe7.png",
  "../imagenes/cafe8.png",
  "../imagenes/iconos/icon-72x72.png",
  "../imagenes/iconos/icon-96x96.png",
  "../imagenes/iconos/icon-128x128.png",
  "../imagenes/iconos/icon-144x144.png",
  "../imagenes/iconos/icon-152x152.png",
  "../imagenes/iconos/icon-192x192.png",
  "../imagenes/iconos/icon-384x384.png",
  "../imagenes/iconos/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestURL = new URL(event.request.url);
  const isAppFile = /\.(html|js|css|json)$/.test(requestURL.pathname);

  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok && networkResponse.type === "basic") {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("./index.html");
        }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
