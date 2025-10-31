// Service Worker для PWA поддержки
const CACHE_NAME = 'crm-cache-v3'; // Обновлено: v3 для полного пропуска API запросов (не перехватываем их)
const urlsToCache = [
  '/',
  '/index.html',
];

// Install event - кэшируем ресурсы (только если они доступны)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Пытаемся добавить ресурсы, игнорируем ошибки для недоступных файлов
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.log(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .catch((error) => {
        console.log('Cache setup failed:', error);
      })
  );
  // Принудительно активируем новый service worker немедленно
  self.skipWaiting();
});

// Fetch event - возвращаем из кэша или сети
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const requestUrl = event.request.url;
  
  // Пропускаем API запросы - они должны идти напрямую в сеть для правильной работы CORS
  // Проверяем: запросы к бэкенду API (внешний домен или путь /api/)
  const isApiRequest = 
    // Запросы к бэкенду на onrender.com (включая crm-backend-1e1e.onrender.com)
    url.hostname.includes('crm-backend') ||
    // Запросы к onrender.com с путем /api/
    (url.hostname.includes('onrender.com') && url.pathname.startsWith('/api/')) ||
    // Запросы к localhost API в dev режиме
    (url.hostname.includes('localhost') && url.pathname.startsWith('/api/')) ||
    // Запросы с путем /api/ (если фронтенд и бэкенд на одном домене)
    url.pathname.startsWith('/api/') ||
    // Проверяем полный URL для всех запросов к бэкенду
    requestUrl.includes('/api/');
  
  if (isApiRequest) {
    // Для API запросов НЕ перехватываем - пропускаем напрямую в сеть
    // Это критически важно для правильной работы CORS заголовков
    // НЕ вызываем event.respondWith() - пусть запрос идет напрямую в сеть
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
  // Принудительно берем контроль над всеми клиентами
  return self.clients.claim();
});

