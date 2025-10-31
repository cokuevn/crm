// Service Worker для PWA поддержки
const CACHE_NAME = 'crm-cache-v2'; // Обновлено: v2 для пропуска API запросов и исправления CORS
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
];

// Install event - кэшируем ресурсы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache addAll failed:', error);
      })
  );
});

// Fetch event - возвращаем из кэша или сети
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Пропускаем API запросы - они должны идти напрямую в сеть для правильной работы CORS
  // Проверяем: запросы к бэкенду API (внешний домен или путь /api/)
  const isApiRequest = 
    // Запросы к бэкенду на onrender.com (включая crm-backend-1e1e.onrender.com)
    url.hostname.includes('crm-backend') ||
    // Запросы к localhost API в dev режиме
    (url.hostname.includes('localhost') && url.pathname.startsWith('/api/')) ||
    // Запросы с путем /api/ (если фронтенд и бэкенд на одном домене)
    url.pathname.startsWith('/api/');
  
  if (isApiRequest) {
    // Для API запросов не используем кэш, идем напрямую в сеть
    // Это критически важно для правильной работы CORS заголовков
    // Передаем запрос как есть, без модификаций, чтобы сохранить все заголовки и CORS режим
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Для статических ресурсов используем кэш
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Если нашли в кэше, возвращаем
        if (response) {
          return response;
        }
        // Иначе запрашиваем из сети
        return fetch(event.request);
      })
  );
});

// Activate event - очищаем старый кэш
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

