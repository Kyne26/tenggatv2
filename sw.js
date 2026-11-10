const V = "tenggat-v3";
const ASSETS = [
  "./",
  "index.html",
  "kalender.html",
  "tambah.html",
  "pengaturan.html",
  "offline.html",
  "manifest.webmanifest",
  "assets/css/output.css",
  "assets/icons/favicon.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/js/app.js",
  "assets/js/core/date-utils.js",
  "assets/js/core/store.js",
  "assets/js/parser/parse-message.js",
  "assets/js/components/nav.js",
  "assets/js/components/task-item.js",
  "assets/js/components/toast.js",
  "assets/js/components/icons.js",
  "assets/js/components/modal.js",
  "assets/js/components/task-form.js",
  "assets/js/pages/home.js",
  "assets/js/pages/calendar.js",
  "assets/js/pages/add.js",
  "assets/js/pages/settings.js",
];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(V)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((k) =>
        Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))),
      )
      .then(() => clients.claim()),
  ),
);

// Network-first: kalau online selalu ambil file terbaru, kalau offline baru pakai cache.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(V).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(e.request, { ignoreSearch: true })
          .then((r) => r || caches.match("offline.html")),
      ),
  );
});
