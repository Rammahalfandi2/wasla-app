// اسم مخزن مؤقت (Cache) خاص بنسخة التطبيق
const CACHE_NAME = "wasla-cache-v1";

// الملفات الأساسية التي نريد حفظها لتعمل حتى مع ضعف الإنترنت
const FILES_TO_CACHE = [
  "/trip.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});