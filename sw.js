const VERSION = "asoul-life-v24-0825";
const SHELL_CACHE = `${VERSION}-shell`;
const IMAGE_CACHE = `${VERSION}-images`;
const SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=0821",
  "./weekly-planner.css?v=0821",
  "./weekly-polish.css?v=0821",
  "./complete-polish.css?v=0821",
  "./mobile-app.css?v=0825",
  "./data-model.js?v=0821",
  "./stickers.js?v=0821",
  "./冷笑话.js?v=0821",
  "./app.js?v=0825",
  "./favicon.svg",
  "./manifest.webmanifest?v=0825",
  "./icons/1.png?v=0825",
  "./icons/icon-yigehun.png?v=0821",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./图片/其他图片/Asoul-高清.png",
  "./图片/其他图片/贝.png",
  "./图片/其他图片/然.png",
  "./图片/其他图片/乃.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== SHELL_CACHE && key !== IMAGE_CACHE).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put("./index.html", copy));
        return response;
      })
      .catch(() => caches.match("./index.html")));
    return;
  }
  if (/\.(?:png|jpe?g|gif|webp|svg)$/i.test(url.pathname)) {
    event.respondWith(caches.open(IMAGE_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
