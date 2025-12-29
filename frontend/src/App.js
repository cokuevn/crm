import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './Navigation';
import { listCapitals, deleteCapital as deleteCapitalService } from './lib/services/capitalsService';
import Analytics from './pages/Analytics';
import AIChat from './features/chat/AIChat';
import Chat from './pages/Chat';
import ImportModal from './components/modals/ImportModal';
import AddCapitalModal from './components/modals/AddCapitalModal';
import BalanceModal from './components/modals/BalanceModal';
import ConfirmDialog from './components/ui/ConfirmDialog';
import ClientDetails from './pages/ClientDetails';
import AddClientForm from './pages/AddClientForm';
import Expenses from './pages/Expenses';
import Dashboard from './pages/Dashboard';
import { getAuthHeaders } from './lib/api';
import apiClient from './lib/apiClient';
import NotificationToast from './components/ui/NotificationToast';
import InstallPrompt from './components/InstallPrompt';
import { autoInit, migrateContractDates } from './lib/services/systemService';
import Skeleton from './components/ui/Skeleton';
import { waitForAuth } from './lib/apiClient';

// Login Component

// Auth Context moved to ./contexts/AuthContext

// Header moved into Navigation component; UI widgets moved to components/ui/*

// Login Component
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const { login, register, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isRegister ? 'Создать аккаунт' : 'Войти в CRM'}
          </h1>
          <p className="text-gray-600">Система управления рассрочками</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">или</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex items-center justify-center space-x-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Войти через Google</span>
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [capitals, setCapitals] = useState([]);
  const [selectedCapital, setSelectedCapital] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedCapital');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Persist selected capital
  useEffect(() => {
    if (selectedCapital) {
      localStorage.setItem('selectedCapital', JSON.stringify(selectedCapital));
    }
  }, [selectedCapital]);
  const [showAddCapitalModal, setShowAddCapitalModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user, logout } = useAuth();
  const invalidateCache = useAppStore(state => state.invalidateCache);

  // PWA Splash Screen Animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2 секунды анимации
    return () => clearTimeout(timer);
  }, []);

  // PWA Support: Service Worker registration with auto-update
  useEffect(() => {
    // Start waking up the backend immediately
    apiClient.get('/api/ping').catch(() => {});

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('SW registered:', registration);
            
            // Проверяем обновления каждые 60 секунд
            setInterval(() => {
              registration.update();
            }, 60000);
            
            // Слушаем событие обновления
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Новая версия доступна - показываем уведомление и перезагружаем
                    console.log('New version available! Reloading...');
                    
                    // Показываем уведомление пользователю
                    if (window.dispatchEvent) {
                      window.dispatchEvent(
                        new CustomEvent('app:notify', {
                          detail: {
                            type: 'info',
                            title: 'Обновление',
                            message: 'Загружена новая версия приложения...',
                          },
                        })
                      );
                    }
                    
                    // Ждем 2 секунды и перезагружаем страницу
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  }
                });
              }
            });
          })
          .catch(error => {
            console.log('SW registration failed:', error);
          });
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      autoInitAndFetchCapitals();
    } else {
      setIsInitialLoad(false);
    }

    // Add online listener to auto-refresh data when connection is restored
    const handleOnline = () => {
      console.log('App is online, refreshing data...');
      showNotification('info', 'Подключение восстановлено', 'Обновляем данные...');
      if (user) {
        fetchCapitals();
        // Emit event for other components to refresh
        window.dispatchEvent(new CustomEvent('app:online'));
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const autoInitAndFetchCapitals = async () => {
    try {
      setIsInitialLoad(true);
      // Wait for auth to be fully ready before first request
      await waitForAuth();
      
      // First, try to fetch existing capitals
      let data = await listCapitals();
      
      // If data is empty, wait 1.5s and try one more time
      // This helps with transient network lags or auth sync issues
      if (!data || data.length === 0) {
        console.warn('Capitals list empty, retrying in 1.5s...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        data = await listCapitals();
      }
      
      if (data && data.length > 0) {
        setCapitals(data);
        
        // If we have a saved selected capital, make sure it's still in the list
        if (selectedCapital) {
          const stillExists = data.find(c => c.id === selectedCapital.id);
          if (stillExists) {
            setSelectedCapital(stillExists);
          } else {
            setSelectedCapital(data[0]);
          }
        } else {
          setSelectedCapital(data[0]);
        }
      } else {
        // If no capitals, try auto-init (it will create mock data for new users)
        console.log('No capitals found, running auto-init...');
        await autoInit();
        // Fetch again after init
        const freshData = await listCapitals();
        setCapitals(freshData || []);
        if (freshData && freshData.length > 0) {
          setSelectedCapital(freshData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching/initializing capitals:', error);
      // Even on error, try to fetch once more just in case
      try {
        const data = await listCapitals();
        setCapitals(data || []);
      } catch (e) {}
    } finally {
      setIsInitialLoad(false);
    }
  };

  const fetchCapitals = async () => {
    try {
      const data = await listCapitals();
      setCapitals(data || []);
      
      // Update selected capital if it exists in the fresh list
      if (selectedCapital) {
        const fresh = data.find(c => c.id === selectedCapital.id);
        if (fresh) setSelectedCapital(fresh);
      } else if (data.length > 0) {
        setSelectedCapital(data[0]);
      }
    } catch (error) {
      console.error('Error fetching capitals:', error);
    }
  };

  const showNotification = (type, title, message) => {
    const notification = { type, title, message };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== notification));
    }, 5000);
  };

  // Listen for global notifications (e.g., from apiClient 401)
  useEffect(() => {
    const handler = (e) => {
      const { type, title, message } = e.detail || {};
      if (type && title) showNotification(type, title, message);
    };
    window.addEventListener('app:notify', handler);
    return () => window.removeEventListener('app:notify', handler);
  }, []);

  const removeNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleCapitalAdded = (newCapital) => {
    console.log('New capital added:', newCapital);
    setCapitals(prev => [...prev, newCapital]);
    setSelectedCapital(newCapital);
    showNotification('success', 'Капитал создан', `${newCapital.name} успешно создан`);
    fetchCapitals();
  };

  const handleBalanceUpdated = (updatedCapital) => {
    setCapitals(prev => prev.map(c => 
      c.id === updatedCapital.id ? updatedCapital : c
    ));
    setSelectedCapital(updatedCapital);
    invalidateCache(); // Clear cache as balance changed
    showNotification('success', 'Баланс обновлен', `Баланс капитала "${updatedCapital.name}" обновлен`);
    setShowBalanceModal(false);
  };

  const handleShowBalanceModal = (capital) => {
    setSelectedCapital(capital);
    setShowBalanceModal(true);
  };

  const handleDeleteCapital = async (capitalId) => {
    try {
      await deleteCapitalService(capitalId);
      setCapitals(prev => prev.filter(c => c.id !== capitalId));
      
      // Select first remaining capital or null
      const remainingCapitals = capitals.filter(c => c.id !== capitalId);
      setSelectedCapital(remainingCapitals.length > 0 ? remainingCapitals[0] : null);
      
      showNotification('success', 'Капитал удален', 'Капитал и все связанные данные удалены');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting capital:', error);
      showNotification('error', 'Ошибка', 'Не удалось удалить капитал');
    }
  };

  const handleClientClick = (clientId) => {
    setSelectedClientId(clientId);
    setCurrentPage('client-details');
  };

  const handleBackToDashboard = () => {
    setSelectedClientId(null);
    setCurrentPage('dashboard');
  };

  const handleClientAdded = (newClient) => {
    showNotification('success', 'Клиент добавлен', `${newClient.name} успешно добавлен`);
    invalidateCache(); // Clear cache to show new client
    // Refresh capitals to update balance
    fetchCapitals();
    setCurrentPage('dashboard');
  };

  const handleMigrateContractDates = async () => {
    try {
      const result = await migrateContractDates();
      showNotification('success', 'Миграция завершена', `Обработано ${result.migrated_count} клиентов`);
    } catch (error) {
      console.error('Error migrating contract dates:', error);
      showNotification('error', 'Ошибка миграции', 'Не удалось обновить даты договоров');
    }
  };

  const handleMigratePaymentSchedules = async () => {
    try {
      const response = await apiClient.post('/api/migrate-payment-schedules');
      const result = response.data;
      showNotification('success', 'Миграция графиков завершена', 
        `Обновлено ${result.migrated_count} из ${result.total_clients} клиентов`);
      
      // Refresh dashboard data to show updated schedules
      fetchCapitals();
    } catch (error) {
      console.error('Error migrating payment schedules:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось обновить графики платежей';
      showNotification('error', 'Ошибка миграции', errorMessage);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'analytics':
        return (
          <Analytics
            selectedCapital={selectedCapital}
            onBack={() => setCurrentPage('dashboard')}
            onClientClick={handleClientClick}
          />
        );
      case 'expenses':
        return <Expenses selectedCapital={selectedCapital} onBack={() => setCurrentPage('dashboard')} />;
      case 'add-client':
        return (
          <AddClientForm 
            capitals={capitals}
            selectedCapital={selectedCapital}
            onClientAdded={handleClientAdded}
            onBack={() => setCurrentPage('dashboard')}
          />
        );
      case 'chat':
        return <Chat selectedCapital={selectedCapital} />;
      case 'client-details':
        return (
          <ClientDetails
            clientId={selectedClientId}
            onBack={handleBackToDashboard}
            capitals={capitals}
          />
        );
      default:
        return (
          <Dashboard 
            selectedCapital={selectedCapital}
            onClientClick={handleClientClick}
          />
        );
    }
  };

  return (
    <>
      {/* Splash Screen */}
      {showSplash && (
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-50 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* App Icon */}
              <motion.div
                className="w-32 h-32 mx-auto mb-6 relative"
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  ease: 'easeInOut',
                  times: [0, 0.25, 0.5, 0.75, 1],
                }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <circle cx="100" cy="100" r="90" fill="url(#splashGradient)" opacity="0.3" filter="url(#glow)"/>
                  <path
                    d="M100 30 C 80 30, 65 45, 65 65 L 65 85 L 55 85 L 55 115 L 65 115 L 65 135 C 65 155, 80 170, 100 170 C 120 170, 135 155, 135 135 L 135 115 L 145 115 L 145 85 L 135 85 L 135 65 C 135 45, 120 30, 100 30 Z"
                    fill="url(#splashGradient)"
                    filter="url(#glow)"
                  />
                  <text
                    x="100"
                    y="125"
                    textAnchor="middle"
                    fontSize="60"
                    fontWeight="bold"
                    fill="white"
                    filter="url(#glow)"
                  >
                    C
                  </text>
                </svg>
              </motion.div>
              
              {/* App Name */}
              <motion.h1
                className="text-3xl font-bold text-white mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Comfort CRM
              </motion.h1>
              
              {/* Loading Dots */}
              <motion.div
                className="flex justify-center gap-2 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
      
      {isInitialLoad ? (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Загрузка данных...</p>
          </div>
        </div>
      ) : (
        <motion.div 
          className="min-h-screen bg-bg-light dark:bg-bg-dark transition-colors duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        capitals={capitals}
        selectedCapital={selectedCapital}
        onCapitalChange={setSelectedCapital}
        onShowAddCapital={() => setShowAddCapitalModal(true)}
        onShowBalanceModal={handleShowBalanceModal}
        onShowImport={() => setShowImportModal(true)}
        onDeleteCapital={() => setShowDeleteConfirm(selectedCapital)}
        onMigrateContractDates={handleMigrateContractDates}
        onMigratePaymentSchedules={handleMigratePaymentSchedules}
        user={user}
        onLogout={logout}
      />
      
      <AnimatePresence mode="wait">
        <motion.main 
          key={currentPage}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {renderCurrentPage()}
        </motion.main>
      </AnimatePresence>

      {/* Modals */}
      <AddCapitalModal
        isOpen={showAddCapitalModal}
        onClose={() => setShowAddCapitalModal(false)}
        onCapitalAdded={handleCapitalAdded}
      />

      <BalanceModal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        capital={selectedCapital}
        onBalanceUpdated={handleBalanceUpdated}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        selectedCapital={selectedCapital}
        onNotify={(type, title, message) => showNotification(type, title, message)}
        onClientsImported={() => {
          showNotification('success', 'Импорт завершен', 'Клиенты успешно импортированы');
          invalidateCache(); // Clear cache after import
          fetchCapitals();
          setCurrentPage('dashboard');
        }}
      />

      {/* Balance Modal */}

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        title="🗑️ Удалить капитал?"
        description={showDeleteConfirm ? `Вы уверены, что хотите удалить капитал "${showDeleteConfirm.name}"? Все клиенты и платежи будут также удалены. Это действие нельзя отменить.` : ''}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDeleteCapital(showDeleteConfirm.id)}
      />

      {/* AI Chat */}
      <AIChat selectedCapital={selectedCapital} />

      {/* Notifications */}
      <NotificationToast notifications={notifications} onClose={removeNotification} />
      
      {/* Install Prompt */}
      <InstallPrompt />
    </motion.div>
    )}
    </>
  );
};

// Main App Component
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">Загрузка...</p>
          <div className="space-y-2 max-w-md mx-auto px-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="App">
      {user ? <MainApp /> : <LoginPage />}
    </div>
  );
}

// Export the App wrapped with AuthProvider
export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}