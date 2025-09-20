const CACHE_NAME = 'uygulama-onbellegi-v1';
const CACHED_URLS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/uygulama-logom.png'
];

// Dosyaları önbelleğe alma işlemi
self.addEventListener('install', (event) => {
  console.log('Service Worker kuruluyor ve dosyalar önbelleğe alınıyor.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CACHED_URLS);
      })
  );
});

// Ağ isteği geldiğinde önbellek stratejisini uygulama
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Önce ağı dene
    fetch(event.request)
      .then((response) => {
        // Ağdan başarılı yanıt gelirse önbelleğe kaydet
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => {
        // Ağ yoksa veya başarısız olursa önbellekten yanıt al
        console.log('Ağ bağlantısı yok, önbellekten sunuluyor.');
        return caches.match(event.request);
      })
  );
});

// Eski önbellekleri temizleme ve mesaj gönderme
self.addEventListener('activate', (event) => {
  console.log('Service Worker etkinleştiriliyor.');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Eski önbellek siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Sayfaya önbelleğin temizlendiğine dair mesaj gönder
      return clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
      }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'cache-cleared'
          });
        }
      });
    })
  );
});
