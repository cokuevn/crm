import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import './App.css';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBl5uYNwRUoUYHc6jYzjIuVN9WQf9f6_O0",
  authDomain: "finance-a88e4.firebaseapp.com",
  projectId: "finance-a88e4",
  storageBucket: "finance-a88e4.appspot.com",
  messagingSenderId: "1014638766847",
  appId: "1:1014638766847:web:8f7a5c5e4d7d9e5a8b1c2d",
  measurementId: "G-5KPTGF8K8Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

// Component for Adding Capital
const AddCapitalModal = ({ isOpen, onClose, onCapitalAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    balance: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const token = await user.getIdToken();
      const response = await fetch(`${API}/api/capitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newCapital = await response.json();
        onCapitalAdded(newCapital);
        setFormData({ name: '', description: '', balance: 0 });
        onClose();
      } else {
        throw new Error('Failed to create capital');
      }
    } catch (error) {
      console.error('Error creating capital:', error);
      alert('Ошибка при создании капитала');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Создать капитал
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название капитала *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Введите название капитала"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows="3"
              placeholder="Опишите назначение капитала"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Начальный баланс (₽)
            </label>
            <input
              type="number"
              min="0"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="0"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Balance Management Modal
const BalanceModal = ({ isOpen, onClose, capital, onBalanceUpdated }) => {
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState('add'); // 'add' or 'subtract'
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const newBalance = operation === 'add' 
        ? capital.balance + parseFloat(amount)
        : capital.balance - parseFloat(amount);

      if (newBalance < 0) {
        alert('Недостаточно средств для списания');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API}/api/capitals/${capital.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ balance: newBalance })
      });

      if (response.ok) {
        const updatedCapital = await response.json();
        onBalanceUpdated(updatedCapital);
        
        // Create balance change record
        await fetch(`${API}/api/expenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            capital_id: capital.id,
            amount: parseFloat(amount),
            description: description || `${operation === 'add' ? 'Пополнение' : 'Списание'} баланса`,
            category: operation === 'add' ? 'Пополнение' : 'Корректировка'
          })
        });

        setAmount('');
        setDescription('');
        setOperation('add');
        onClose();
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Ошибка при изменении баланса');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !capital) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Управление балансом
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

        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="text-sm text-gray-600">Текущий баланс:</div>
          <div className="text-2xl font-bold text-gray-900">
            {capital.balance?.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Операция
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOperation('add')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  operation === 'add'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                + Пополнить
              </button>
              <button
                type="button"
                onClick={() => setOperation('subtract')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  operation === 'subtract'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                - Списать
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сумма (₽) *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Введите сумму"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows="3"
              placeholder="Опишите операцию"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 ${
                operation === 'add' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {loading ? 'Обработка...' : (operation === 'add' ? 'Пополнить' : 'Списать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Import Clients Modal (replaces Export Modal)
const ImportModal = ({ isOpen, onClose, selectedCapital, onClientsImported }) => {
  const [importData, setImportData] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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
        }
      } catch (error) {
        alert('Ошибка при чтении файла');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Введите данные для импорта');
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

      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      let successCount = 0;
      let errorCount = 0;

      for (const clientData of clients) {
        try {
          const response = await fetch(`${API}/api/clients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              ...clientData,
              capital_id: selectedCapital.id
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      alert(`Импорт завершен: ${successCount} клиентов добавлено, ${errorCount} ошибок`);
      onClientsImported();
      setImportData('');
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      alert('Ошибка при импорте данных. Проверьте формат JSON.');
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
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto p-6 shadow-2xl">
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

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Загрузить файл
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  Выбрать файл (.json, .csv)
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Или скопируйте JSON данные в поле ниже
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JSON данные клиентов
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                placeholder="Вставьте JSON данные здесь..."
              />
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Пример формата данных:
              </h4>
              <pre className="bg-gray-50 p-4 rounded-xl text-sm overflow-auto">
                {JSON.stringify(sampleData, null, 2)}
              </pre>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h5 className="font-medium text-yellow-800 mb-2">Обязательные поля:</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• name - ФИО клиента</li>
                <li>• product - название товара</li>
                <li>• purchase_amount - сумма покупки</li>
                <li>• debt_amount - долг клиента</li>
                <li>• monthly_payment - ежемесячный платеж</li>
                <li>• months - количество месяцев</li>
                <li>• start_date - дата начала (YYYY-MM-DD)</li>
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
            disabled={loading || !selectedCapital}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Импорт...' : 'Импортировать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { AddCapitalModal, BalanceModal, ImportModal };