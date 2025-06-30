import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import * as XLSX from 'xlsx';

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
const API = BACKEND_URL;

// Helper function to get authorization headers
const getAuthHeaders = async (user) => {
  if (user) {
    try {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.uid}`
      };
    } catch (error) {
      console.error('Error getting user UID:', error);
    }
  }
  
  return {
    'Content-Type': 'application/json'
  };
};

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

// Notifications Component
const NotificationToast = ({ notifications, onClose }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className={`max-w-sm w-full bg-white shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transition-all duration-300 ${
            notification.type === 'success' ? 'border-l-4 border-green-500' :
            notification.type === 'error' ? 'border-l-4 border-red-500' :
            notification.type === 'warning' ? 'border-l-4 border-yellow-500' :
            'border-l-4 border-blue-500'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`w-5 h-5 rounded-full ${
                  notification.type === 'success' ? 'bg-green-500' :
                  notification.type === 'error' ? 'bg-red-500' :
                  notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => onClose(index)}
                >
                  <span className="sr-only">Закрыть</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = "emerald" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorMap = {
    emerald: "#10b981",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    orange: "#f59e0b"
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        height={size}
        width={size}
        className="transform -rotate-90"
      >
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={colorMap[color] || colorMap.emerald}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {progress.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

// Import Modal Component with Excel support
const ImportModal = ({ isOpen, onClose, selectedCapital, onClientsImported }) => {
  const [importData, setImportData] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileInputRef] = useState(React.createRef());
  const { user } = useAuth();

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.json')) {
          setImportData(e.target.result);
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV to JSON format
          const lines = e.target.result.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          const jsonData = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim());
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = values[index] || '';
              });
              jsonData.push(obj);
            }
          }
          setImportData(JSON.stringify(jsonData, null, 2));
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel file
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with proper mapping
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            alert('Excel файл должен содержать заголовки и данные');
            return;
          }
          
          const headers = jsonData[0];
          const mappedData = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.some(cell => cell && cell.toString().trim())) { // Skip empty rows
              const clientData = {
                name: row[0] || '', // ФИО
                product: row[1] || '', // Товар
                purchase_amount: parseFloat(row[2]) || 0, // Сумма покупки
                debt_amount: parseFloat(row[3]) || 0, // Долг
                monthly_payment: parseFloat(row[4]) || 0, // Ежемесячный платеж
                months: parseInt(row[5]) || 12, // Количество месяцев
                start_date: row[6] ? formatExcelDate(row[6]) : new Date().toISOString().split('T')[0], // Дата начала
                client_address: row[7] || '', // Адрес
                client_phone: row[8] || '', // Телефон клиента
                guarantor_name: row[9] || '', // ФИО гаранта
                guarantor_phone: row[10] || '' // Телефон гаранта
              };
              mappedData.push(clientData);
            }
          }
          
          setImportData(JSON.stringify(mappedData, null, 2));
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Ошибка при чтении файла: ' + error.message);
      }
    };
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const formatExcelDate = (excelDate) => {
    // Excel dates are stored as numbers (days since 1900-01-01)
    if (typeof excelDate === 'number') {
      const date = XLSX.SSF.parse_date_code(excelDate);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    // If it's already a string, try to parse it
    if (typeof excelDate === 'string') {
      const parsedDate = new Date(excelDate);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Выберите файл для импорта');
      return;
    }

    if (!selectedCapital) {
      alert('Выберите капитал для импорта');
      return;
    }

    setLoading(true);
    try {
      const clients = JSON.parse(importData);
      if (!Array.isArray(clients)) {
        throw new Error('Данные должны быть массивом клиентов');
      }

      const headers = await getAuthHeaders(user);
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const clientData of clients) {
        try {
          const response = await axios.post(`${API}/api/clients`, {
            ...clientData,
            capital_id: selectedCapital.id
          }, { headers });

          if (response.status === 200 || response.status === 201) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Клиент ${clientData.name}: ${response.data.detail || 'неизвестная ошибка'}`);
          }
        } catch (error) {
          errorCount++;
          errors.push(`Клиент ${clientData.name}: ${error.response?.data?.detail || error.message}`);
        }
      }

      let message = `Импорт завершен: ${successCount} клиентов добавлено`;
      if (errorCount > 0) {
        message += `, ${errorCount} ошибок`;
        if (errors.length > 0) {
          message += `\n\nОшибки:\n${errors.slice(0, 5).join('\n')}`;
          if (errors.length > 5) {
            message += `\n... и еще ${errors.length - 5} ошибок`;
          }
        }
      }
      
      alert(message);
      onClientsImported();
      setImportData('');
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      alert('Ошибка при импорте данных: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sampleData = [
    {
      name: "Иванов Иван Иванович",
      product: "iPhone 15",
      purchase_amount: 120000,
      debt_amount: 120000,
      monthly_payment: 10000,
      months: 12,
      start_date: "2024-12-01",
      client_address: "г. Москва, ул. Примерная, д. 1",
      client_phone: "+7 999 123-45-67",
      guarantor_name: "Иванова Мария Петровна",
      guarantor_phone: "+7 999 123-45-68"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[85vh] overflow-auto p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Импорт клиентов в "{selectedCapital?.name}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Загрузить файл
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-blue-500 hover:text-blue-600 font-medium text-lg"
                >
                  📁 Выбрать файл
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Поддерживаемые форматы:
                </p>
                <div className="flex justify-center gap-2 mt-1">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Excel (.xlsx, .xls)</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">CSV</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">JSON</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Данные для импорта (JSON)
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-80 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                placeholder="Выберите файл или вставьте JSON данные..."
              />
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                🔗 Структура Excel файла:
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl text-sm overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left p-1 font-medium">A</th>
                      <th className="text-left p-1 font-medium">B</th>
                      <th className="text-left p-1 font-medium">C</th>
                      <th className="text-left p-1 font-medium">D</th>
                      <th className="text-left p-1 font-medium">E</th>
                      <th className="text-left p-1 font-medium">F</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-1">ФИО</td>
                      <td className="p-1">Товар</td>
                      <td className="p-1">Сумма</td>
                      <td className="p-1">Долг</td>
                      <td className="p-1">Платеж</td>
                      <td className="p-1">Месяцы</td>
                    </tr>
                    <tr className="text-gray-600">
                      <td className="p-1">Иванов И.И.</td>
                      <td className="p-1">iPhone 15</td>
                      <td className="p-1">120000</td>
                      <td className="p-1">120000</td>
                      <td className="p-1">10000</td>
                      <td className="p-1">12</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-gray-600">
                  G: Дата начала • H: Адрес • I: Телефон • J: ФИО гаранта • K: Телефон гаранта
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="font-medium text-gray-800 mb-2">📋 Пример JSON:</h5>
              <pre className="bg-gray-50 p-3 rounded-xl text-xs overflow-auto max-h-32">
                {JSON.stringify(sampleData[0], null, 2)}
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h5 className="font-medium text-blue-800 mb-2">ℹ️ Важно:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Первая строка Excel должна содержать данные (без заголовков)</li>
                <li>• Суммы указывайте числами без пробелов</li>
                <li>• Даты в формате ДД.ММ.ГГГГ или ГГГГ-ММ-ДД</li>
                <li>• Пустые строки будут пропущены</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !selectedCapital || !importData.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Импортирование...' : '📥 Импортировать'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Analytics Component
const Analytics = ({ selectedCapital }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (selectedCapital) {
      fetchAnalytics();
    }
  }, [selectedCapital]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders(user);
      const response = await axios.get(`${API}/api/analytics/${selectedCapital.id}`, { headers });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загружаем аналитику...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных для аналитики</h3>
        <p className="text-gray-600">Добавьте клиентов для отображения аналитики</p>
      </div>
    );
  }

  const collectionRate = analytics.collection_rate || 0;
  const paymentCompletionRate = analytics.payment_completion_rate || 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего клиентов</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_clients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Общая сумма</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_amount?.toLocaleString()}₽</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Собрано средств</p>
              <p className="text-2xl font-bold text-emerald-600">{analytics.total_paid?.toLocaleString()}₽</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего расходов</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.total_expenses?.toLocaleString()}₽</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Просроченные</p>
              <p className="text-2xl font-bold text-red-600">{analytics.overdue_payments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Процент сбора</h3>
          <div className="flex items-center justify-center">
            <ProgressRing progress={collectionRate} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Собрано {analytics.total_paid?.toLocaleString()}₽ из {analytics.total_amount?.toLocaleString()}₽
            </p>
          </div>
        </div>

        {/* Payment Completion Rate */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Выполнение платежей</h3>
          <div className="flex items-center justify-center">
            <ProgressRing progress={paymentCompletionRate} color="emerald" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Оплачено {analytics.paid_payments} из {analytics.total_payments} платежей
            </p>
          </div>
        </div>

        {/* Financial Balance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Финансовый баланс</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Текущий баланс</span>
              <span className="text-lg font-semibold text-blue-600">{analytics.current_balance?.toLocaleString()}₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Всего доходов</span>
              <span className="text-lg font-semibold text-green-600">{analytics.total_paid?.toLocaleString()}₽</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Всего расходов</span>
              <span className="text-lg font-semibold text-purple-600">{analytics.total_expenses?.toLocaleString()}₽</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-900">Чистая прибыль</span>
              <span className={`text-lg font-semibold ${analytics.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.net_profit?.toLocaleString()}₽
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Статус клиентов</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-800">Активные</span>
              <span className="text-lg font-semibold text-green-900">{analytics.active_clients}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Завершённые</span>
              <span className="text-lg font-semibold text-gray-900">{analytics.total_clients - analytics.active_clients}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Финансовая сводка</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-800">Общая сумма</span>
              <span className="text-lg font-semibold text-blue-900">{analytics.total_amount?.toLocaleString()}₽</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-800">Оплачено</span>
              <span className="text-lg font-semibold text-green-900">{analytics.total_paid?.toLocaleString()}₽</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-800">К оплате</span>
              <span className="text-lg font-semibold text-orange-900">{analytics.outstanding?.toLocaleString()}₽</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border-t border-purple-200">
              <span className="text-sm font-medium text-purple-800">Эффективность</span>
              <span className="text-lg font-semibold text-purple-900">{collectionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Client Modal Component
const EditClientModal = ({ isOpen, onClose, client, onClientUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    product: '',
    purchase_amount: '',
    debt_amount: '',
    monthly_payment: '',
    guarantor_name: '',
    client_address: '',
    client_phone: '',
    guarantor_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        name: client.name || '',
        product: client.product || '',
        purchase_amount: client.purchase_amount || client.total_amount || '',
        debt_amount: client.debt_amount || client.total_amount || '',
        monthly_payment: client.monthly_payment || '',
        guarantor_name: client.guarantor_name || '',
        client_address: client.client_address || '',
        client_phone: client.client_phone || '',
        guarantor_phone: client.guarantor_phone || ''
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders(user);
      const response = await axios.put(`${API}/api/clients/${client.client_id}`, {
        ...formData,
        purchase_amount: parseFloat(formData.purchase_amount),
        debt_amount: parseFloat(formData.debt_amount),
        monthly_payment: parseFloat(formData.monthly_payment)
      }, { headers });

      if (onClientUpdated) {
        onClientUpdated(response.data);
      }
      onClose();
    } catch (error) {
      setError(error.response?.data?.detail || 'Ошибка при обновлении клиента');
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            ✏️ Редактировать клиента
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">📋 Основная информация</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ФИО клиента *
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
                  Товар *
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес клиента
                </label>
                <input
                  type="text"
                  name="client_address"
                  value={formData.client_address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон клиента
                </label>
                <input
                  type="tel"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Финансовая информация */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">💰 Финансовая информация</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сумма покупки (₽) *
                </label>
                <input
                  type="number"
                  name="purchase_amount"
                  value={formData.purchase_amount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Долг клиента (₽) *
                </label>
                <input
                  type="number"
                  name="debt_amount"
                  value={formData.debt_amount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ежемесячный платёж (₽) *
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
            </div>
          </div>

          {/* Информация о гаранте */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">🤝 Информация о гаранте</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ФИО гаранта
                </label>
                <input
                  type="text"
                  name="guarantor_name"
                  value={formData.guarantor_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон гаранта
                </label>
                <input
                  type="tel"
                  name="guarantor_phone"
                  value={formData.guarantor_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
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
              {loading ? 'Сохранение...' : '💾 Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Client Details Component
const ClientDetails = ({ clientId, onBack, capitals }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders(user);
      const response = await axios.get(`${API}/api/clients/${clientId}`, { headers });
      setClient(response.data);
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientUpdated = (updatedClient) => {
    setClient(updatedClient);
  };

  const handleDeleteClient = async () => {
    try {
      const headers = await getAuthHeaders(user);
      await axios.delete(`${API}/clients/${clientId}`, { headers });
      onBack(); // Вернуться к списку после удаления
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Ошибка при удалении клиента');
    }
  };

  const updatePaymentStatus = async (paymentDate, status) => {
    try {
      const headers = await getAuthHeaders(user);
      const response = await axios.put(`${API}/clients/${clientId}/payments/${paymentDate}`, { status }, { headers });
      
      // Refresh client data
      fetchClientDetails();
      setShowPaymentModal(null);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Ошибка при изменении статуса платежа');
    }
  };

  const getPaymentStatusColor = (payment) => {
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);

    if (payment.status === 'paid') {
      return 'bg-green-50/80 backdrop-blur-sm text-green-800 border-green-200/50';
    } else if (paymentDate < today) {
      return 'bg-red-50/80 backdrop-blur-sm text-red-800 border-red-200/50';
    } else if (paymentDate.getTime() === today.getTime()) {
      return 'bg-orange-50/80 backdrop-blur-sm text-orange-800 border-orange-200/50';
    } else {
      return 'bg-gray-50/80 backdrop-blur-sm text-gray-800 border-gray-200/50';
    }
  };

  const getPaymentStatusText = (payment) => {
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);

    if (payment.status === 'paid') {
      return 'Оплачено';
    } else if (paymentDate < today) {
      return 'Просрочено';
    } else if (paymentDate.getTime() === today.getTime()) {
      return 'Сегодня';
    } else {
      return 'Ожидается';
    }
  };

  const getPaymentStatusIcon = (payment) => {
    const paymentDate = new Date(payment.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);

    if (payment.status === 'paid') {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (paymentDate < today) {
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    } else if (paymentDate.getTime() === today.getTime()) {
      return (
        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Загружаем данные клиента...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-red-100/80 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Клиент не найден</h3>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Назад к списку</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const capital = capitals.find(c => c.id === client.capital_id);
  const effectiveDebtAmount = client.debt_amount || client.total_amount || 0;
  const totalPaid = client.schedule?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingAmount = effectiveDebtAmount - totalPaid;
  const progress = effectiveDebtAmount > 0 ? (totalPaid / effectiveDebtAmount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-500 mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl px-2 py-1"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Назад к списку клиентов</span>
          </button>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-gray-200/50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  {client.name}
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-gray-50/80 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600 mb-1">Товар</p>
                    <p className="text-lg font-semibold text-gray-900">{client.product}</p>
                  </div>
                  <div className="p-4 bg-gray-50/80 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600 mb-1">Капитал</p>
                    <p className="text-lg font-semibold text-gray-900">{capital?.name || 'Неизвестно'}</p>
                  </div>
                  <div className="p-4 bg-gray-50/80 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600 mb-1">Сумма покупки</p>
                    <p className="text-lg font-semibold text-blue-600">{(client.purchase_amount || client.total_amount || 0).toLocaleString()}₽</p>
                  </div>
                  <div className="p-4 bg-gray-50/80 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600 mb-1">Долг клиента</p>
                    <p className="text-lg font-semibold text-red-600">{(client.debt_amount || client.total_amount || 0).toLocaleString()}₽</p>
                  </div>
                  <div className="p-4 bg-gray-50/80 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600 mb-1">Ежемесячный платёж</p>
                    <p className="text-lg font-semibold text-purple-600">{client.monthly_payment?.toLocaleString()}₽</p>
                  </div>
                  <div className="p-4 bg-gray-50/80 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600 mb-1">Телефон</p>
                    <p className="text-lg font-semibold text-gray-900">{client.client_phone || 'Не указан'}</p>
                  </div>
                </div>

                {/* Дополнительная информация */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50/80 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600 mb-1">Адрес</p>
                    <p className="text-lg font-semibold text-gray-900">{client.client_address || 'Не указан'}</p>
                  </div>
                  <div className="p-4 bg-gray-50/80 rounded-2xl">
                    <p className="text-sm font-medium text-gray-600 mb-1">Гарант</p>
                    <p className="text-lg font-semibold text-gray-900">{client.guarantor_name || 'Не указан'}</p>
                    {client.guarantor_phone && (
                      <p className="text-sm text-gray-600 mt-1">{client.guarantor_phone}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4">
                <span className={`px-4 py-2 text-sm font-semibold rounded-2xl ${
                  client.status === 'active'
                    ? 'bg-green-100/80 text-green-800'
                    : client.status === 'overdue'
                    ? 'bg-red-100/80 text-red-800'
                    : 'bg-gray-100/80 text-gray-800'
                }`}>
                  {client.status === 'active' ? 'Активен' : 
                   client.status === 'overdue' ? 'Просрочка' : 'Завершён'}
                </span>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-5 py-3 bg-blue-500 text-white text-sm font-semibold rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-500/30"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Редактировать</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-5 py-3 bg-red-500 text-white text-sm font-semibold rounded-2xl hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-lg shadow-red-500/30"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Удалить</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-2xl backdrop-blur-sm">
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-3">
                <span>Оплачено: {totalPaid.toLocaleString()}₽</span>
                <span>Осталось: {remainingAmount.toLocaleString()}₽</span>
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm font-semibold text-gray-700 mt-3 text-center">
                {progress.toFixed(1)}% выполнено
              </p>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50">
          <div className="px-8 py-6 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              График платежей
            </h2>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {client.schedule?.map((payment, index) => (
                <div 
                  key={index}
                  className={`border-2 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 ${getPaymentStatusColor(payment)}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      {getPaymentStatusIcon(payment)}
                      <div>
                        <p className="font-bold text-xl">
                          {payment.amount?.toLocaleString()}₽
                        </p>
                        <p className="text-sm font-medium opacity-75">
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/50 backdrop-blur-sm">
                      {getPaymentStatusText(payment)}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setShowPaymentModal(payment)}
                    className="w-full mt-4 px-4 py-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-current hover:bg-white/80 transition-all text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Изменить статус</span>
                    </div>
                  </button>
                  
                  {payment.status === 'paid' && payment.paid_date && (
                    <p className="text-xs font-medium mt-3 text-center opacity-75">
                      <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Оплачено {formatDate(payment.paid_date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditClientModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={client}
        onClientUpdated={handleClientUpdated}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              🗑️ Удалить клиента?
            </h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить клиента <strong>"{client.name}"</strong>? 
              Все данные о платежах будут также удалены. Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteClient}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-200/50">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Изменить статус платежа
            </h3>
            <div className="text-center mb-8 p-4 bg-gray-50/80 rounded-2xl">
              <p className="text-lg font-semibold text-gray-900 mb-1">
                {showPaymentModal.amount?.toLocaleString()}₽
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(showPaymentModal.payment_date)}
              </p>
            </div>
            <div className="space-y-3 mb-8">
              <button
                onClick={() => updatePaymentStatus(showPaymentModal.payment_date, 'pending')}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gray-50/80 text-gray-800 rounded-2xl hover:bg-gray-100/80 transition-all font-semibold"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ожидается</span>
              </button>
              <button
                onClick={() => updatePaymentStatus(showPaymentModal.payment_date, 'paid')}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-green-50/80 text-green-800 rounded-2xl hover:bg-green-100/80 transition-all font-semibold"
              >
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Оплачено</span>
              </button>
              <button
                onClick={() => updatePaymentStatus(showPaymentModal.payment_date, 'overdue')}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-red-50/80 text-red-800 rounded-2xl hover:bg-red-100/80 transition-all font-semibold"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Просрочено</span>
              </button>
            </div>
            <button
              onClick={() => setShowPaymentModal(null)}
              className="w-full px-6 py-4 text-gray-700 bg-gray-100/80 rounded-2xl hover:bg-gray-200/80 transition-all font-semibold"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Capital Modal Component
const AddCapitalModal = ({ isOpen, onClose, onCapitalAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders(user);
      const response = await axios.post(`${API}/api/capitals`, formData, { headers });
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-200/50">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900">
            Создать новый капитал
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-2xl mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Название капитала
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-500"
              placeholder="Например: Основной фонд"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Описание (необязательно)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-4 bg-gray-50/80 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-500 resize-none"
              placeholder="Краткое описание назначения капитала"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100/80 rounded-2xl hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-blue-500/30"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Создание...</span>
                </div>
              ) : (
                'Капитал'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = ({ currentPage, onPageChange, capitals, selectedCapital, onCapitalChange, onShowAddCapital, onDeleteCapital, onShowBalanceModal, onShowImport }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => onPageChange('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentPage === 'dashboard'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Дашборд</span>
              </div>
            </button>
            <button
              onClick={() => onPageChange('analytics')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentPage === 'analytics'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Аналитика</span>
              </div>
            </button>
            <button
              onClick={() => {
                onPageChange('expenses');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all ${
                currentPage === 'expenses'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Расходы</span>
            </button>
            <button
              onClick={() => onPageChange('add-client')}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                currentPage === 'add-client'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Клиент</span>
              </div>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {capitals.length > 0 && (
              <div className="flex items-center space-x-2">
                <select
                  value={selectedCapital?.id || ''}
                  onChange={(e) => {
                    const capital = capitals.find(c => c.id === e.target.value);
                    onCapitalChange(capital);
                  }}
                  className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none min-w-[180px]"
                >
                  {capitals.map(capital => (
                    <option key={capital.id} value={capital.id}>
                      {capital.name}
                    </option>
                  ))}
                </select>
                
                {/* Delete icon for current capital */}
                {selectedCapital && (
                  <button
                    onClick={() => onDeleteCapital(selectedCapital)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    title={`Удалить "${selectedCapital.name}"`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            
            {/* Clickable Balance */}
            {selectedCapital && (
              <button
                onClick={() => onShowBalanceModal(selectedCapital)}
                className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                title="Управление балансом"
              >
                💰 {selectedCapital.balance?.toLocaleString('ru-RU') || 0} ₽
              </button>
            )}
            
            <button
              onClick={onShowAddCapital}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-lg shadow-green-500/30"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Капитал</span>
              </div>
            </button>
            
            <button
              onClick={onShowImport}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-500/30"
              disabled={!selectedCapital}
              title={!selectedCapital ? "Выберите капитал для импорта" : "Импорт клиентов"}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Импорт</span>
              </div>
            </button>
            
            <button
              onClick={onShowImport}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-500/30"
              disabled={!selectedCapital}
              title={!selectedCapital ? "Выберите капитал для импорта" : "Импорт клиентов"}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Импорт</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-xl">
            <div className="px-4 pt-2 pb-6 space-y-3">
              <button
                onClick={() => {
                  onPageChange('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all ${
                  currentPage === 'dashboard'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Дашборд</span>
              </button>
              <button
                onClick={() => {
                  onPageChange('analytics');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all ${
                  currentPage === 'analytics'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Аналитика</span>
              </button>
              <button
                onClick={() => {
                  onPageChange('expenses');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all ${
                  currentPage === 'expenses'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Расходы</span>
              </button>
              <button
                onClick={() => {
                  onPageChange('add-client');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all ${
                  currentPage === 'add-client'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Клиент</span>
              </button>
              
              {/* Mobile Capital Selection */}
              {capitals.length > 0 && (
                <div className="pt-4 border-t border-gray-200/50">
                  <label className="block text-sm font-medium text-gray-700 mb-2 px-1">
                    Капитал
                  </label>
                  <div className="flex items-center space-x-2 mb-3">
                    <select
                      value={selectedCapital?.id || ''}
                      onChange={(e) => {
                        const capital = capitals.find(c => c.id === e.target.value);
                        onCapitalChange(capital);
                      }}
                      className="flex-1 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {capitals.map(capital => (
                        <option key={capital.id} value={capital.id}>
                          {capital.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Delete icon for current capital */}
                    {selectedCapital && (
                      <button
                        onClick={() => {
                          onDeleteCapital(selectedCapital);
                          setIsMobileMenuOpen(false);
                        }}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title={`Удалить "${selectedCapital.name}"`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Mobile Clickable Balance */}
                  {selectedCapital && (
                    <button
                      onClick={() => {
                        onShowBalanceModal(selectedCapital);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors mb-3"
                    >
                      💰 Баланс: {selectedCapital.balance?.toLocaleString('ru-RU') || 0} ₽
                    </button>
                  )}
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200/50 space-y-3">
                <button
                  onClick={() => {
                    onShowAddCapital();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Капитал</span>
                </button>
                

              </div>
            </div>
          </div>
        )}
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

// Add Client Form Component
// Enhanced AddClientForm Component with iOS Design
const AddClientForm = ({ capitals, selectedCapital, onClientAdded }) => {
  const [formData, setFormData] = useState({
    capital_id: selectedCapital?.id || '',
    name: '',
    product: '',
    purchase_amount: '',
    debt_amount: '',
    monthly_payment: '',
    guarantor_name: '',
    client_address: '',
    client_phone: '',
    guarantor_phone: '',
    months: '',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

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
      const headers = await getAuthHeaders(user);
      const response = await axios.post(`${API}/api/clients`, {
        ...formData,
        purchase_amount: parseFloat(formData.purchase_amount),
        debt_amount: parseFloat(formData.debt_amount),
        monthly_payment: parseFloat(formData.monthly_payment),
        months: parseInt(formData.months)
      }, { headers });

      setSuccess('Клиент успешно добавлен!');
      setFormData({
        capital_id: selectedCapital?.id || '',
        name: '',
        product: '',
        purchase_amount: '',
        debt_amount: '',
        monthly_payment: '',
        guarantor_name: '',
        client_address: '',
        client_phone: '',
        guarantor_phone: '',
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
    
    // Auto-fill debt amount if purchase amount changes and debt is empty
    if (name === 'purchase_amount' && !formData.debt_amount) {
      setFormData(prev => ({ ...prev, debt_amount: value }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Icons.User />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Добавить нового клиента</h2>
              <p className="text-gray-600 mt-1">Заполните информацию о клиенте и условиях рассрочки</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
              <Icons.Warning />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
              <Icons.Check />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Capital Selection */}
            <div className="bg-gray-50/50 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Icons.Money />
                <h3 className="text-lg font-semibold text-gray-900">Выбор капитала</h3>
              </div>
              <select
                name="capital_id"
                value={formData.capital_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
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

            {/* Client Information */}
            <div className="bg-blue-50/30 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Icons.User />
                <h3 className="text-lg font-semibold text-gray-900">Основная информация</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.User />
                    <span>ФИО клиента *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="Иванов Иван Иванович"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Device />
                    <span>Товар *</span>
                  </label>
                  <input
                    type="text"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="iPhone 15 Pro"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Location />
                    <span>Адрес клиента</span>
                  </label>
                  <input
                    type="text"
                    name="client_address"
                    value={formData.client_address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Phone />
                    <span>Телефон клиента</span>
                  </label>
                  <input
                    type="tel"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="+7 (123) 456-78-90"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-green-50/30 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Icons.Money />
                <h3 className="text-lg font-semibold text-gray-900">Финансовая информация</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Money />
                    <span>Сумма покупки (₽) *</span>
                  </label>
                  <input
                    type="number"
                    name="purchase_amount"
                    value={formData.purchase_amount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                    min="0"
                    step="0.01"
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Money />
                    <span>Долг клиента (₽) *</span>
                  </label>
                  <input
                    type="number"
                    name="debt_amount"
                    value={formData.debt_amount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                    min="0"
                    step="0.01"
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Calendar />
                    <span>Ежемесячный платёж (₽) *</span>
                  </label>
                  <input
                    type="number"
                    name="monthly_payment"
                    value={formData.monthly_payment}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                    min="0"
                    step="0.01"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Clock />
                    <span>Количество месяцев *</span>
                  </label>
                  <input
                    type="number"
                    name="months"
                    value={formData.months}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                    min="1"
                    max="60"
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Calendar />
                    <span>Дата начала рассрочки *</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Guarantor Information */}
            <div className="bg-purple-50/30 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Icons.User />
                <h3 className="text-lg font-semibold text-gray-900">Информация о гаранте</h3>
                <span className="text-sm text-gray-500">(необязательно)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.User />
                    <span>ФИО гаранта</span>
                  </label>
                  <input
                    type="text"
                    name="guarantor_name"
                    value={formData.guarantor_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="Иванова Мария Петровна"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Phone />
                    <span>Телефон гаранта</span>
                  </label>
                  <input
                    type="tel"
                    name="guarantor_phone"
                    value={formData.guarantor_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="+7 (123) 456-78-91"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200/50">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Добавление...</span>
                  </>
                ) : (
                  <>
                    <Icons.User />
                    <span>Клиент</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// SVG Icons Component
const Icons = {
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Location: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Money: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Grid: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Device: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Wallet: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Receipt: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
};

// Balance Management Modal
const BalanceModal = ({ isOpen, onClose, capital, onBalanceUpdated }) => {
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (capital && isOpen) {
      setBalance(capital.balance?.toString() || '0');
      setError('');
    }
  }, [capital, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders(user);
      const response = await axios.put(`${API}/api/capitals/${capital.id}`, {
        balance: parseFloat(balance)
      }, { headers });

      if (onBalanceUpdated) {
        onBalanceUpdated(response.data);
      }
      onClose();
    } catch (error) {
      setError(error.response?.data?.detail || 'Ошибка при обновлении баланса');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Icons.Wallet />
            <span>Управление балансом</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          >
            <Icons.Close />
          </button>
        </div>

        {capital && (
          <div className="mb-4 p-4 bg-blue-50/80 rounded-xl">
            <p className="text-sm text-blue-800 font-medium">
              Капитал: {capital.name}
            </p>
            <p className="text-sm text-blue-600">
              Текущий баланс: {capital.balance?.toLocaleString() || 0}₽
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center space-x-2">
            <Icons.Warning />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Icons.Money />
              <span>Новый баланс (₽)</span>
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              placeholder="100000"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Icons.Check />
                  <span>Сохранить</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Expenses Component
const Expenses = ({ selectedCapital }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (selectedCapital) {
      fetchExpenses();
    }
  }, [selectedCapital]);

  const fetchExpenses = async () => {
    if (!selectedCapital) return;
    
    setLoading(true);
    try {
      const headers = await getAuthHeaders(user);
      const response = await axios.get(`${API}/api/expenses`, {
        params: { capital_id: selectedCapital.id },
        headers
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseAdded = (newExpense) => {
    setExpenses(prev => [newExpense, ...prev]);
    setShowAddModal(false);
  };

  const handleExpenseUpdated = (updatedExpense) => {
    setExpenses(prev => prev.map(exp => 
      exp.expense_id === updatedExpense.expense_id ? updatedExpense : exp
    ));
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот расход?')) return;

    try {
      const headers = await getAuthHeaders(user);
      await axios.delete(`${API}/api/expenses/${expenseId}`, { headers });
      setExpenses(prev => prev.filter(exp => exp.expense_id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Ошибка при удалении расхода');
    }
  };

  if (!selectedCapital) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icons.Receipt />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Выберите капитал</h3>
        <p className="text-gray-600">Выберите капитал для просмотра расходов</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Загружаем расходы...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Icons.Receipt />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Расходы</h2>
            <p className="text-gray-600">Управление расходами капитала "{selectedCapital.name}"</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-lg shadow-purple-600/25"
        >
          <Icons.Plus />
          <span>Добавить расход</span>
        </button>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Receipt />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет расходов</h3>
          <p className="text-gray-600 mb-4">Добавьте первый расход для этого капитала</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Добавить расход
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenses.map(expense => (
            <div 
              key={expense.expense_id}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Icons.Receipt />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                    <p className="text-sm text-gray-600">{expense.expense_date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingExpense(expense)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.expense_id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Icons.Money />
                  <span className="text-sm">Сумма:</span>
                </div>
                <span className="font-semibold text-lg text-purple-600">{expense.amount.toLocaleString()}₽</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      <ExpenseModal
        isOpen={showAddModal || !!editingExpense}
        onClose={() => {
          setShowAddModal(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
        capital={selectedCapital}
        onExpenseAdded={handleExpenseAdded}
        onExpenseUpdated={handleExpenseUpdated}
      />
    </div>
  );
};

// Expense Modal Component
const ExpenseModal = ({ isOpen, onClose, expense, capital, onExpenseAdded, onExpenseUpdated }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (expense && isOpen) {
      setFormData({
        amount: expense.amount?.toString() || '',
        description: expense.description || '',
        expense_date: expense.expense_date || new Date().toISOString().split('T')[0]
      });
      setError('');
    } else if (!expense && isOpen) {
      setFormData({
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
      setError('');
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const headers = await getAuthHeaders(user);
      const data = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (expense) {
        // Update existing expense
        const response = await axios.put(`${API}/api/expenses/${expense.expense_id}`, data, { headers });
        if (onExpenseUpdated) {
          onExpenseUpdated(response.data);
        }
      } else {
        // Create new expense
        data.capital_id = capital.id;
        const response = await axios.post(`${API}/api/expenses`, data, { headers });
        if (onExpenseAdded) {
          onExpenseAdded(response.data);
        }
      }

      onClose();
    } catch (error) {
      setError(error.response?.data?.detail || 'Ошибка при сохранении расхода');
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
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Icons.Receipt />
            <span>{expense ? 'Редактировать расход' : 'Добавить расход'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1"
          >
            <Icons.Close />
          </button>
        </div>

        {error && (
          <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center space-x-2">
            <Icons.Warning />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Icons.Receipt />
              <span>Назначение расхода *</span>
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
              placeholder="Аренда офиса, реклама, расходные материалы..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Icons.Money />
              <span>Сумма расхода (₽) *</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
              placeholder="5000"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Icons.Calendar />
              <span>Дата расхода *</span>
            </label>
            <input
              type="date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Icons.Check />
                  <span>{expense ? 'Обновить' : 'Добавить'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payment Progress Component  
const PaymentProgress = ({ client }) => {
  const totalPayments = client.schedule?.length || 0;
  const paidPayments = client.schedule?.filter(p => p.status === 'paid').length || 0;
  const progress = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Прогресс платежей</span>
        <span>{paidPayments}/{totalPayments}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}% выполнено</div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ selectedCapital, onClientClick }) => {
  const [dashboardData, setDashboardData] = useState({
    today: [],
    tomorrow: [],
    overdue: [],
    all_clients: []
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Reset filter when capital changes
    setFilter('all');
    setSearchTerm('');
    fetchDashboardData();
  }, [selectedCapital]);

  const fetchDashboardData = async () => {
    if (!selectedCapital) return;
    
    setLoading(true);
    try {
      const headers = await getAuthHeaders(user);
      const response = await axios.get(`${API}/api/dashboard`, {
        params: { capital_id: selectedCapital.id },
        headers
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredClients = () => {
    // Always start with all clients as base
    let baseClients = dashboardData.all_clients || [];
    let filteredClients = [];
    
    switch (filter) {
      case 'today':
        // Filter all clients to show only those with payments due today
        const todayItems = dashboardData.today || [];
        const todayClientIds = todayItems.map(item => item.client.client_id);
        filteredClients = baseClients.filter(client => 
          todayClientIds.includes(client.client_id)
        ).map(client => ({
          ...client,
          filterReason: 'Платёж сегодня'
        }));
        break;
      case 'tomorrow':
        // Filter all clients to show only those with payments due tomorrow
        const tomorrowItems = dashboardData.tomorrow || [];
        const tomorrowClientIds = tomorrowItems.map(item => item.client.client_id);
        filteredClients = baseClients.filter(client => 
          tomorrowClientIds.includes(client.client_id)
        ).map(client => ({
          ...client,
          filterReason: 'Платёж завтра'
        }));
        break;
      case 'overdue':
        // Filter all clients to show only those with overdue payments
        const overdueItems = dashboardData.overdue || [];
        const overdueClientIds = overdueItems.map(item => item.client.client_id);
        filteredClients = baseClients.filter(client => 
          overdueClientIds.includes(client.client_id)
        ).map(client => ({
          ...client,
          filterReason: 'Просроченный платёж'
        }));
        break;
      default:
        // Show all clients without any filtering
        filteredClients = [...baseClients];
    }

    // Apply search filter
    if (searchTerm) {
      filteredClients = filteredClients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.client_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredClients;
  };

  const filteredClients = getFilteredClients();

  if (!selectedCapital) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icons.Money />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Выберите капитал</h3>
        <p className="text-gray-600">Создайте или выберите капитал для просмотра дашборда</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Загружаем дашборд...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern iOS-style Search Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Поиск по имени, товару или ID клиента..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 placeholder-gray-500"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <div className="text-gray-400">
                <Icons.Search />
              </div>
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icons.Close />
            </button>
          )}
        </div>
      </div>

      {/* iOS-style Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.Grid />
          <span>Все клиенты ({dashboardData.all_clients?.length || 0})</span>
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
            filter === 'today'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.Calendar />
          <span>Сегодня ({dashboardData.today?.length || 0})</span>
        </button>
        <button
          onClick={() => setFilter('tomorrow')}
          className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
            filter === 'tomorrow'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.Clock />
          <span>Завтра ({dashboardData.tomorrow?.length || 0})</span>
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
            filter === 'overdue'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.Warning />
          <span>Просрочено ({dashboardData.overdue?.length || 0})</span>
        </button>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-800">
              <Icons.Search />
              <span>Поиск: "{searchTerm}" • Найдено: {filteredClients.length} клиентов</span>
            </div>
            {filteredClients.length === 0 && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Очистить поиск
              </button>
            )}
          </div>
        </div>
      )}

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {searchTerm ? <Icons.Search /> : filter === 'today' ? <Icons.Calendar /> : filter === 'tomorrow' ? <Icons.Clock /> : filter === 'overdue' ? <Icons.Warning /> : <Icons.Grid />}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm 
              ? 'Клиенты не найдены' 
              : filter === 'today' 
                ? 'Нет платежей на сегодня' 
                : filter === 'tomorrow'
                  ? 'Нет платежей на завтра'
                  : filter === 'overdue'
                    ? 'Нет просроченных платежей'
                    : 'Нет клиентов'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Попробуйте изменить поисковый запрос'
              : filter === 'all' 
                ? 'Добавьте первого клиента'
                : 'Отлично! Все платежи под контролем'
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Очистить поиск
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
              <div 
                key={client.client_id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer group"
                onClick={() => onClientClick(client.client_id)}
              >
                {/* Header with status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-600' 
                        : client.status === 'overdue'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icons.User />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {client.name}
                      </h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Icons.Device />
                        <span className="truncate">{client.product}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    client.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : client.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status === 'active' ? 'Активен' : client.status === 'overdue' ? 'Просрочен' : 'Завершён'}
                  </span>
                </div>

                {/* Client Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Icons.Money />
                      <span>Долг:</span>
                    </div>
                    <span className="font-semibold text-gray-900">{(client.debt_amount || client.total_amount || 0).toLocaleString()}₽</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Icons.Phone />
                      <span>Телефон:</span>
                    </div>
                    <span className="font-medium text-gray-700">{client.client_phone || 'Не указан'}</span>
                  </div>
                  <div className="flex items-start justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Icons.Location />
                      <span>Адрес:</span>
                    </div>
                    <span className="font-medium text-gray-700 text-right max-w-[60%] break-words">{client.client_address || 'Не указан'}</span>
                  </div>
                </div>

                {/* Filter reason badge */}
                {client.filterReason && (
                  <div className="mb-4 p-3 bg-orange-50/80 border border-orange-200/50 rounded-xl text-sm text-orange-800 flex items-center space-x-2">
                    <Icons.Warning />
                    <span>{client.filterReason}</span>
                  </div>
                )}

                {/* Progress bar */}
                <div className="mb-4">
                  <PaymentProgress client={client} />
                </div>

                {/* Monthly payment */}
                <div className="pt-4 border-t border-gray-200/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Icons.Calendar />
                      <span>Ежемесячный платёж:</span>
                    </div>
                    <span className="font-semibold text-blue-600">{client.monthly_payment?.toLocaleString()}₽</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Header Component
const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">CRM Рассрочка</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 hidden sm:inline">
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

// Main App Component
const MainApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [capitals, setCapitals] = useState([]);
  const [selectedCapital, setSelectedCapital] = useState(null);
  const [showAddCapitalModal, setShowAddCapitalModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      autoInitAndFetchCapitals();
    }
  }, [user]);

  const autoInitAndFetchCapitals = async () => {
    try {
      const headers = await getAuthHeaders(user);
      // Auto-initialize data if needed
      await axios.get(`${API}/api/auto-init`, { headers });
      // Then fetch capitals
      fetchCapitals();
    } catch (error) {
      console.error('Error auto-initializing data:', error);
      // Fallback to just fetching capitals
      fetchCapitals();
    }
  };

  const fetchCapitals = async () => {
    try {
      const headers = await getAuthHeaders(user);
      const response = await axios.get(`${API}/api/capitals`, { headers });
      setCapitals(response.data);
      if (response.data.length > 0 && !selectedCapital) {
        setSelectedCapital(response.data[0]);
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
    showNotification('success', 'Баланс обновлен', `Баланс капитала "${updatedCapital.name}" обновлен`);
    setShowBalanceModal(false);
  };

  const handleShowBalanceModal = (capital) => {
    setSelectedCapital(capital);
    setShowBalanceModal(true);
  };

  const handleDeleteCapital = async (capitalId) => {
    try {
      const headers = await getAuthHeaders(user);
      await axios.delete(`${API}/api/capitals/${capitalId}`, { headers });
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
    // Refresh capitals to update balance
    fetchCapitals();
    setCurrentPage('dashboard');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'analytics':
        return <Analytics selectedCapital={selectedCapital} />;
      case 'expenses':
        return <Expenses selectedCapital={selectedCapital} />;
      case 'add-client':
        return (
          <AddClientForm 
            capitals={capitals}
            selectedCapital={selectedCapital}
            onClientAdded={handleClientAdded}
          />
        );
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        capitals={capitals}
        selectedCapital={selectedCapital}
        onCapitalChange={setSelectedCapital}
        onShowAddCapital={() => setShowAddCapitalModal(true)}
        onDeleteCapital={(capital) => setShowDeleteConfirm(capital)}
        onShowBalanceModal={handleShowBalanceModal}
        onShowImport={() => setShowImportModal(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentPage()}
      </main>

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
        onClientsImported={() => {
          showNotification('success', 'Импорт завершен', 'Клиенты успешно импортированы');
          fetchCapitals();
          setCurrentPage('dashboard');
        }}
      />

      {/* Balance Modal */}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              🗑️ Удалить капитал?
            </h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить капитал <strong>"{showDeleteConfirm.name}"</strong>? 
              Все клиенты и платежи будут также удалены. Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteCapital(showDeleteConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationToast notifications={notifications} onClose={removeNotification} />
    </div>
  );
};

// Main App Component
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
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

// Export the App wrapped with AuthProvider
export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}