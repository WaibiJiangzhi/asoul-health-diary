const VERSION = "asoul-life-v136-0943";
const SHELL_CACHE = `${VERSION}-shell`;
const IMAGE_CACHE = `${VERSION}-images`;
const SHELL = [
  "./",
  "./index.html",
  "./css/design-system.css?v=0879",
  "./css/legacy/styles.css?v=0915",
  "./css/legacy/weekly-polish.css?v=0863",
  "./css/legacy/complete-polish.css?v=0915",
  "./css/platform/mobile-app.css?v=0941",
  "./css/platform/responsive-platform.css?v=0932",
  "./css/pages/home.css?v=0926",
  "./css/pages/goals.css?v=0941",
  "./css/pages/schedule.css?v=0938",
  "./css/pages/charts.css?v=0942",
  "./css/pages/personal.css?v=0925",
  "./js/core/data-model.js?v=0905",
  "./js/core/app-utils.js?v=0865",
  "./js/core/backup-codec.js?v=0905",
  "./js/domain/milestone-domain.js?v=0868",
  "./js/domain/chart-domain.js?v=0922",
  "./js/domain/schedule-domain.js?v=0932",
  "./js/ui/snap-carousel.js?v=0905",
  "./js/ui/canvas-utils.js?v=0930",
  "./js/ui/weekly-report-renderer.js?v=0930",
  "./js/ui/chart-renderer.js?v=0942",
  "./js/content/stickers.js?v=0929",
  "./js/content/冷笑话.js?v=0913",
  "./js/core/app-config.js?v=0929",
  "./js/core/state-normalizer.js?v=0929",
  "./js/core/state-store.js?v=0905",
  "./js/app.js?v=0943",
  "./manifest.webmanifest?v=0923",
  "./icons/icon-v3-192.png",
  "./icons/icon-v3-512.png",
  "./icons/icon-v3.png?v=0921",
  "./images/其他图片/Asoul-高清.png",
  "./images/其他图片/贝.png",
  "./images/其他图片/然.png",
  "./images/其他图片/乃.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
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
