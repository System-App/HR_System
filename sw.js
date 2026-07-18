/*  سیستەمی موفرەد — Service Worker
 *  ستراتیژی: NETWORK-FIRST
 *  - کاتێک ئینتەرنێت هەیە: هەمیشە نوێترین وەشان دەهێنێت (ئەپدەیتەکان یەکسەر دەگەنە خەڵک).
 *  - کاتێک ئینتەرنێت نییە: لە کاش کارەکە بەردەوام دەبێت.
 *
 *  ⚠️ لە هەر جارێک ئەپدەیتکردندا CACHE ژمارەکە زیاد بکە (v1 -> v2 ...)
 *     بۆ ئەوەی کاشە کۆنەکە بسڕدرێتەوە.
 */
const CACHE = 'mofrad-v1';

const ASSETS = [
  './',
  './index.html',
  './home.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-48.png'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () { /* یەک فایل نەگیرا؟ کێشە نییە */ });
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k !== CACHE; })
                          .map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // داواکاریی دەرەکی (فۆنتی گووگڵ ...) بەبێ دەستکاری ڕادەکات
  if (url.origin !== self.location.origin) return;

  event.respondWith((async function () {
    try {
      // NETWORK FIRST — نوێترین وەشان
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      // ئۆفلاین — لە کاش
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const idx = await caches.match('./index.html');
        if (idx) return idx;
      }
      throw err;
    }
  })());
});
