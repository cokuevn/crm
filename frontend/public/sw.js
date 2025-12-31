// Service Worker для PWA поддержки
const CACHE_NAME = 'crm-cache-v9'; // Обновлено: v9 - улучшена производительность
const VERSION = '9'; // Версия для логирования
const urlsToCache = [
  '/',
  '/index.html',
];

console.log(`🔄 Service Worker v${VERSION} initializing...`);

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
  
  // Пропускаем запросы к внешним аналитическим сервисам (PostHog, etc)
  const isExternalAnalytics = 
    url.hostname.includes('posthog.com') ||
    url.hostname.includes('analytics') ||
    url.hostname.includes('google-analytics');
  
  if (isApiRequest || isExternalAnalytics) {
    // Для API запросов и внешних сервисов НЕ перехватываем
    // Пропускаем напрямую в сеть для правильной работы CORS
    return;
  }
  
  // Для статических ресурсов используем стратегию "Network First, Cache Fallback"
  // Это обеспечивает актуальность данных при наличии сети
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если получили ответ, сохраняем в кэш для оффлайн использования
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся вернуть из кэша
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Если в кэше тоже нет, возвращаем ошибку
          return new Response('Offline - no cached version available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Message event - для принудительного обновления
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🚀 Force activating new Service Worker...');
    self.skipWaiting();
  }
});

// Notification click event - открываем приложение при клике на уведомление
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.clientId 
    ? `/?client=${event.notification.data.clientId}`
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Проверяем, есть ли уже открытое окно
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Если окна нет, открываем новое
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Periodic background sync для проверки платежей
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-payments') {
    event.waitUntil(checkPaymentsAndNotify());
  }
});

// Функция проверки платежей в фоне
async function checkPaymentsAndNotify() {
  try {
    console.log('🔍 Checking for payments in background...');
    
    // Получаем сохранённый API URL и токен из IndexedDB или кэша
    const cache = await caches.open(CACHE_NAME);
    const configResponse = await cache.match('/pwa-config');
    
    if (!configResponse) {
      console.log('No config found, skipping background check');
      return;
    }
    
    const config = await configResponse.json();
    const { apiUrl, authToken } = config;
    
    if (!apiUrl || !authToken) {
      console.log('Missing API credentials');
      return;
    }
    
    // Запрашиваем данные о платежах
    const response = await fetch(`${apiUrl}/api/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!response.ok) {
      console.log('Failed to fetch dashboard data');
      return;
    }
    
    const data = await response.json();
    
    // Отправляем уведомления о платежах сегодня
    const today = data.today || [];
    for (const item of today) {
      if (item.client && item.payment && item.payment.status === 'pending') {
        await self.registration.showNotification('💰 Платёж сегодня!', {
          body: `${item.client.name}\n${item.payment.amount.toLocaleString()}₽`,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: `payment-today-${item.client.client_id}`,
          requireInteraction: true,
          vibrate: [200, 100, 200],
          data: {
            clientId: item.client.client_id,
            paymentDate: item.payment.payment_date,
          },
        });
      }
    }
    
    // Отправляем уведомления о платежах завтра
    const tomorrow = data.tomorrow || [];
    for (const item of tomorrow) {
      if (item.client && item.payment && item.payment.status === 'pending') {
        await self.registration.showNotification('⏰ Платёж завтра', {
          body: `${item.client.name}\n${item.payment.amount.toLocaleString()}₽`,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: `payment-tomorrow-${item.client.client_id}`,
          vibrate: [200],
          data: {
            clientId: item.client.client_id,
            paymentDate: item.payment.payment_date,
          },
        });
      }
    }
    
    console.log(`✅ Sent ${today.length + tomorrow.length} payment notifications`);
  } catch (error) {
    console.error('Error in background payment check:', error);
  }
}

// Activate event - очищаем старый кэш
self.addEventListener('activate', (event) => {
  console.log(`✅ Service Worker v${VERSION} activated`);
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Принудительно берем контроль над всеми клиентами
  return self.clients.claim();
});