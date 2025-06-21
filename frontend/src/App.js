import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import axios from 'axios';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCi_syoMD2Co6AqaRCS2kIjV_t2sfVqWJw",
  authDomain: "finance-a88e4.firebaseapp.com",
  projectId: "finance-a88e4",
  storageBucket: "finance-a88e4.firebasestorage.app",
  messagingSenderId: "982874806548",
  appId: "1:982874806548:web:aa25e7a3a3bb7dded5ca01",
  measurementId: "G-TDGVVHBS0S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    return signOut(auth);
  };

  const value = {
    user,
    login,
    register,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Add Capital Modal Component
const AddCapitalModal = ({ isOpen, onClose, onCapitalAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/capitals`, formData);
      setFormData({ name: '', description: '' });
      if (onCapitalAdded) {
        onCapitalAdded(response.data);
      }
      onClose();
    } catch (error) {
      setError(error.response?.data?.detail || 'Ошибка при создании капитала');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            💰 Создать новый капитал
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название капитала
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например: Основной фонд"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание (необязательно)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Краткое описание назначения капитала"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать капитал'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = ({ currentPage, onPageChange, capitals, selectedCapital, onCapitalChange, onShowAddCapital }) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => onPageChange('dashboard')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Дашборд
            </button>
            <button
              onClick={() => onPageChange('add-client')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === 'add-client'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👤 Добавить клиента
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {capitals.length > 0 && (
              <select
                value={selectedCapital?.id || ''}
                onChange={(e) => {
                  const capital = capitals.find(c => c.id === e.target.value);
                  onCapitalChange(capital);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                {capitals.map(capital => (
                  <option key={capital.id} value={capital.id}>
                    💰 {capital.name}
                  </option>
                ))}
              </select>
            )}
            
            <button
              onClick={onShowAddCapital}
              className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              ➕ Создать капитал
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500">или</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
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
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Client Form Component
const AddClientForm = ({ capitals, selectedCapital, onClientAdded }) => {
  const [formData, setFormData] = useState({
    capital_id: selectedCapital?.id || '',
    name: '',
    product: '',
    total_amount: '',
    monthly_payment: '',
    months: '',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (selectedCapital) {
      setFormData(prev => ({ ...prev, capital_id: selectedCapital.id }));
    }
  }, [selectedCapital]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API}/clients`, {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        monthly_payment: parseFloat(formData.monthly_payment),
        months: parseInt(formData.months)
      });

      setSuccess('Клиент успешно добавлен!');
      setFormData({
        capital_id: selectedCapital?.id || '',
        name: '',
        product: '',
        total_amount: '',
        monthly_payment: '',
        months: '',
        start_date: new Date().toISOString().split('T')[0]
      });
      
      if (onClientAdded) {
        onClientAdded(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Ошибка при добавлении клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Добавить нового клиента</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Капитал
            </label>
            <select
              name="capital_id"
              value={formData.capital_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Выберите капитал</option>
              {capitals.map(capital => (
                <option key={capital.id} value={capital.id}>
                  {capital.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя клиента
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Товар
              </label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Общая сумма (₽)
              </label>
              <input
                type="number"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ежемесячный платёж (₽)
              </label>
              <input
                type="number"
                name="monthly_payment"
                value={formData.monthly_payment}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Количество месяцев
              </label>
              <input
                type="number"
                name="months"
                value={formData.months}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="1"
                max="60"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата начала рассрочки
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Добавление...' : 'Добавить клиента'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ onPageChange, capitals, selectedCapital, onCapitalChange }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (selectedCapital) {
      fetchDashboardData();
    } else if (capitals.length > 0) {
      setDashboardData({ today: [], tomorrow: [], overdue: [], all_clients: [] });
    }
  }, [selectedCapital, capitals]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/dashboard`, {
        params: { capital_id: selectedCapital?.id }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({ today: [], tomorrow: [], overdue: [], all_clients: [] });
    } finally {
      setLoading(false);
    }
  };

  const initMockData = async () => {
    try {
      const response = await axios.post(`${API}/init-mock-data`);
      console.log('Mock data initialized:', response.data);
      // Refresh page to load new data
      window.location.reload();
    } catch (error) {
      console.error('Error initializing mock data:', error);
    }
  };

  const getFilteredClients = () => {
    if (!dashboardData) return [];
    
    switch (filter) {
      case 'today':
        return dashboardData.today || [];
      case 'tomorrow':
        return dashboardData.tomorrow || [];
      case 'overdue':
        return dashboardData.overdue || [];
      default:
        return (dashboardData.all_clients || []).map(client => ({ client }));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">CRM Рассрочки</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Empty state when no capitals */}
        {capitals.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Добро пожаловать в CRM!
                </h3>
                <p className="text-gray-600 mb-6">
                  Для начала работы создайте тестовые данные с клиентами и капиталами
                </p>
                <button
                  onClick={initMockData}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  🚀 Создать тестовые данные
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard content when capitals exist */}
        {capitals.length > 0 && (
          <>
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Загружаем данные...</p>
              </div>
            )}

            {!loading && (
              <>
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📋 Все клиенты ({(dashboardData?.all_clients || []).length})
                    </button>
                    <button
                      onClick={() => setFilter('today')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'today'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📅 Сегодня ({(dashboardData?.today || []).length})
                    </button>
                    <button
                      onClick={() => setFilter('tomorrow')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'tomorrow'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⏰ Завтра ({(dashboardData?.tomorrow || []).length})
                    </button>
                    <button
                      onClick={() => setFilter('overdue')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'overdue'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⚠️ Просрочено ({(dashboardData?.overdue || []).length})
                    </button>
                  </div>
                </div>

                {/* Client List */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      {filter === 'all' ? 'Все клиенты' :
                       filter === 'today' ? 'Платежи на сегодня' :
                       filter === 'tomorrow' ? 'Платежи на завтра' :
                       'Просроченные платежи'}
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {getFilteredClients().map((item, index) => {
                      const client = item.client;
                      const payment = item.payment;
                      
                      return (
                        <div key={client.client_id || index} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                👤 {client.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                📱 {client.product} • 💰 {client.total_amount?.toLocaleString()}₽
                              </p>
                              {payment && (
                                <p className="text-sm text-blue-600 mt-1 font-medium">
                                  💳 Платёж: {payment.amount?.toLocaleString()}₽ на {payment.payment_date}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                client.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : client.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {client.status === 'active' ? '✅ Активен' : 
                                 client.status === 'overdue' ? '❌ Просрочка' : '✔️ Завершён'}
                              </span>
                              
                              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors">
                                👁️ Подробнее
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {getFilteredClients().length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                      <div className="text-4xl mb-4">
                        {filter === 'today' ? '📅' :
                         filter === 'tomorrow' ? '⏰' :
                         filter === 'overdue' ? '⚠️' : '📋'}
                      </div>
                      <p className="text-lg">
                        {filter === 'all' ? 'Клиенты не найдены' :
                         filter === 'today' ? 'На сегодня платежей нет' :
                         filter === 'tomorrow' ? 'На завтра платежей нет' :
                         'Просроченных платежей нет'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [capitals, setCapitals] = useState([]);
  const [selectedCapital, setSelectedCapital] = useState(null);
  const [showAddCapitalModal, setShowAddCapitalModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCapitals();
    }
  }, [user]);

  const fetchCapitals = async () => {
    try {
      const response = await axios.get(`${API}/capitals`);
      setCapitals(response.data);
      if (response.data.length > 0 && !selectedCapital) {
        setSelectedCapital(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching capitals:', error);
    }
  };

  const handleClientAdded = (newClient) => {
    console.log('New client added:', newClient);
    // Optionally refresh data or show success message
    if (currentPage === 'add-client') {
      setCurrentPage('dashboard');
    }
  };

  const handleCapitalAdded = (newCapital) => {
    console.log('New capital added:', newCapital);
    setCapitals(prev => [...prev, newCapital]);
    setSelectedCapital(newCapital);
    fetchCapitals(); // Refresh to get latest data
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'add-client':
        return (
          <AddClientForm 
            capitals={capitals}
            selectedCapital={selectedCapital}
            onClientAdded={handleClientAdded}
          />
        );
      case 'dashboard':
      default:
        return (
          <Dashboard 
            onPageChange={setCurrentPage}
            capitals={capitals}
            selectedCapital={selectedCapital}
            onCapitalChange={setSelectedCapital}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        capitals={capitals}
        selectedCapital={selectedCapital}
        onCapitalChange={setSelectedCapital}
        onShowAddCapital={() => setShowAddCapitalModal(true)}
      />
      
      {renderCurrentPage()}
      
      <AddCapitalModal
        isOpen={showAddCapitalModal}
        onClose={() => setShowAddCapitalModal(false)}
        onCapitalAdded={handleCapitalAdded}
      />
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {user ? <MainApp /> : <LoginPage />}
    </div>
  );
}

const AppWithAuth = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWithAuth;