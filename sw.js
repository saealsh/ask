/* Service Worker — سؤال المجلس / 36
   تخزين مؤقت ذكي يتيح العمل دون إنترنت وتثبيت اللعبة كتطبيق (PWA) */
const CACHE_VERSION = 'majlis36-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './app-merged.min.js',
  './manifest.json',
];

// تثبيت: تخزين ملفات اللعبة الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

// تفعيل: حذف النسخ القديمة من الكاش
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // ملفات اللعبة الأساسية (نفس الأصل): الكاش أولاً ثم الشبكة
  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // الموارد الخارجية (خطوط Google، أعلام flagcdn): stale-while-revalidate
  // نعرض النسخة المخزّنة فوراً ونحدّثها بالخلفية
  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});
