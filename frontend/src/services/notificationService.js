// Сервис для работы с push-уведомлениями

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Запрос разрешения на уведомления
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('✅ Push notifications permission granted');
        
        // Регистрируем фоновую синхронизацию
        await this.registerBackgroundSync();
        
        return true;
      } else {
        console.log('❌ Push notifications permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Регистрация фоновой синхронизации
  async registerBackgroundSync() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Periodic Background Sync (поддерживается только в Chrome/Edge на Android)
      if ('periodicSync' in registration) {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync',
        });
        
        if (status.state === 'granted') {
          await registration.periodicSync.register('check-payments', {
            minInterval: 12 * 60 * 60 * 1000, // Каждые 12 часов
          });
          console.log('✅ Periodic background sync registered');
        } else {
          console.log('⚠️ Periodic sync permission not granted');
        }
      } else {
        console.log('⚠️ Periodic background sync not supported');
      }
    } catch (error) {
      console.error('Error registering background sync:', error);
    }
  }

  // Сохранение конфигурации для фоновой работы
  async saveConfigForBackgroundSync(apiUrl, authToken) {
    try {
      // Используем тот же кэш, что и в SW (crm-cache-v7)
      const cache = await caches.open('crm-cache-v7');
      const config = { apiUrl, authToken, savedAt: Date.now() };
      
      await cache.put(
        '/pwa-config',
        new Response(JSON.stringify(config), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      
      console.log('✅ Config saved for background sync');
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  // Проверка текущего разрешения
  checkPermission() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission;
  }

  // Показать локальное уведомление
  async showNotification(title, options = {}) {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      // Если есть Service Worker, используем его для уведомлений
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, {
          badge: '/icon.svg',
          icon: '/icon.svg',
          vibrate: [200, 100, 200],
          ...options,
        });
      } else {
        // Fallback на обычное уведомление
        new Notification(title, options);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Отправить уведомление о платеже
  async notifyPaymentDue(client, payment, when = 'today') {
    const title = when === 'today' 
      ? '💰 Платёж сегодня!' 
      : '⏰ Платёж завтра';
    
    const body = `${client.name}\n${payment.amount.toLocaleString()}₽`;
    
    await this.showNotification(title, {
      body,
      tag: `payment-${client.client_id}-${payment.payment_date}`,
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'Посмотреть' },
        { action: 'dismiss', title: 'Закрыть' },
      ],
      data: {
        clientId: client.client_id,
        paymentDate: payment.payment_date,
      },
    });
  }

  // Планировщик уведомлений для платежей
  async schedulePaymentNotifications(dashboardData) {
    if (!dashboardData) return;

    const permission = this.checkPermission();
    if (permission !== 'granted') {
      console.log('Notifications not granted, skipping scheduling');
      return;
    }

    // Уведомления для платежей сегодня
    const today = dashboardData.today || [];
    for (const item of today) {
      if (item.client && item.payment) {
        await this.notifyPaymentDue(item.client, item.payment, 'today');
      }
    }

    // Уведомления для платежей завтра
    const tomorrow = dashboardData.tomorrow || [];
    for (const item of tomorrow) {
      if (item.client && item.payment) {
        await this.notifyPaymentDue(item.client, item.payment, 'tomorrow');
      }
    }
  }

  // Проверка и отправка уведомлений (вызывается при открытии дашборда)
  async checkAndNotify(dashboardData) {
    const permission = this.checkPermission();
    
    if (permission === 'granted') {
      await this.schedulePaymentNotifications(dashboardData);
    } else if (permission === 'default') {
      // Можно запросить разрешение
      console.log('Notification permission not set');
    }
  }
}

// Singleton
const notificationService = new NotificationService();

export default notificationService;

