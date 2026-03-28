// Nanoneuron CRM — Service Worker
// Enables PWA install + basic offline support

const CACHE = "nanoneuron-v1";
const OFFLINE_URLS = ["/", "/dashboard/", "/login/"];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(OFFLINE_URLS).catch(function(){});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e) {
  // Only cache GET requests for same-origin pages, not API calls
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return;

  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match("/");
      });
    })
  );
});
