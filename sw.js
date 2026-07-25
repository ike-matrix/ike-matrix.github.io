/* Ike service worker — precache the app shell so the site works fully offline.
 *
 * Strategy:
 *   - install: precache every shell asset, then take over immediately.
 *   - navigations / index.html: stale-while-revalidate — serve the cached shell
 *     instantly, fetch a fresh copy in the background so new deploys land on the
 *     next load.
 *   - other same-origin shell assets: cache-first (they are content-stable; bump
 *     CACHE below when any of them changes).
 *   - cross-origin requests (Supabase API, etc.): not intercepted — they go
 *     straight to the network and fail cleanly when offline.
 *
 * Bump CACHE when a precached asset other than index.html changes, so the
 * install step re-fetches the shell and the activate step drops the old one.
 */
const CACHE = "ike-shell-v3";
const SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "fonts/fonts.css",
  "fonts/fraunces-latin.woff2",
  "fonts/fraunces-latin-ext.woff2",
  "fonts/nunito-latin.woff2",
  "fonts/nunito-latin-ext.woff2",
  "vendor/supabase.js",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const network = fetch(request)
    .then(res => { if (res && res.ok) cache.put("index.html", res.clone()); return res; })
    .catch(() => null);
  const cached = await cache.match("index.html");
  return cached || (await network) || fetch(request);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // let Supabase & other hosts hit the network directly

  if (req.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith("/index.html")) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  event.respondWith(cacheFirst(req));
});
