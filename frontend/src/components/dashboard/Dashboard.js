import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ClientCard from '../clients/ClientCard';
import AddClientModal from '../modals/AddClientModal';
import AddCapitalModal from '../modals/AddCapitalModal';
import ImportModal from '../modals/ImportModal';
import EditBalanceModal from '../modals/EditBalanceModal';
import DeleteCapitalModal from '../modals/DeleteCapitalModal';
import Button from '../common/Button';
import { PAGES } from '../../constants/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { 
    selectedCapital, 
    capitals,
    selectCapital,
    dashboard, 
    clients,
    loadDashboard, 
    loadClients,
    clientsLoading,
    currentPage,
    setCurrentPage
  } = useApp();
  
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddCapitalModal, setShowAddCapitalModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [showDeleteCapitalModal, setShowDeleteCapitalModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (selectedCapital) {
      loadDashboard(selectedCapital.id);
      loadClients(selectedCapital.id);
    }
  }, [selectedCapital, loadDashboard, loadClients]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Filter clients based on search term and active filter
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.client_id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'today':
          return client.schedule?.some(p => {
            const today = new Date().toISOString().split('T')[0];
            return p.payment_date === today && p.status === 'pending';
          });
        case 'tomorrow':
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          return client.schedule?.some(p => {
            return p.payment_date === tomorrowStr && p.status === 'pending';
          });
        case 'overdue':
          return client.schedule?.some(p => p.status === 'overdue');
        default:
          return true;
      }
    });
  }, [clients, searchTerm, activeFilter]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const todayCount = clients.filter(client => 
      client.schedule?.some(p => {
        const today = new Date().toISOString().split('T')[0];
        return p.payment_date === today && p.status === 'pending';
      })
    ).length;

    const tomorrowCount = clients.filter(client => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      return client.schedule?.some(p => {
        return p.payment_date === tomorrowStr && p.status === 'pending';
      });
    }).length;

    const overdueCount = clients.filter(client => 
      client.schedule?.some(p => p.status === 'overdue')
    ).length;

    return { todayCount, tomorrowCount, overdueCount };
  }, [clients]);

  if (clientsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header and Navigation still render */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">CRM Рассрочка</h1>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <span className="text-gray-900">{user?.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Выйти
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Logo and Capital */}
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-gray-900">CRM Рассрочка</h1>
              
              {/* Compact Capital Section */}
              {capitals.length > 0 && selectedCapital && (
                <div className="flex items-center space-x-4 px-4 py-2 bg-gray-50 rounded-xl border">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedCapital?.id || ''}
                      onChange={(e) => {
                        const capital = capitals.find(c => c.id === e.target.value);
                        selectCapital(capital);
                      }}
                      className="appearance-none bg-transparent border-none text-sm font-semibold text-gray-900 focus:outline-none cursor-pointer pr-5 min-w-0"
                    >
                      {capitals.map(capital => (
                        <option key={capital.id} value={capital.id}>
                          {capital.name}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  <div className="w-px h-6 bg-gray-300"></div>

                  <button 
                    onClick={() => setShowEditBalanceModal(true)}
                    className="flex items-center space-x-2 text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer group"
                  >
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>{formatCurrency(selectedCapital.balance)}</span>
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowDeleteCapitalModal(true)}
                      className="w-6 h-6 bg-red-50 hover:bg-red-100 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                      title="Удалить капитал"
                    >
                      <svg className="w-3 h-3 text-red-600 group-hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <button
                      onClick={() => setShowAddCapitalModal(true)}
                      className="w-6 h-6 bg-green-50 hover:bg-green-100 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                      title="Добавить капитал"
                    >
                      <svg className="w-3 h-3 text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>

                    <button
                      onClick={() => setShowImportModal(true)}
                      disabled={!selectedCapital}
                      className="w-6 h-6 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-50 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 group disabled:hover:scale-100"
                      title="Импорт данных"
                    >
                      <svg className="w-3 h-3 text-blue-600 group-hover:text-blue-700 disabled:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right section - User info */}
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-gray-900">{user?.email}</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Navigation items */}
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentPage(PAGES.DASHBOARD)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === PAGES.DASHBOARD
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Дашборд</span>
              </button>

              <button
                onClick={() => setCurrentPage(PAGES.ANALYTICS)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === PAGES.ANALYTICS
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Аналитика</span>
              </button>

              <button
                onClick={() => setCurrentPage(PAGES.EXPENSES)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === PAGES.EXPENSES
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Расходы</span>
              </button>

              <button
                onClick={() => setShowAddClientModal(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Клиент</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Capital Info Section */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Capital Info */}
            <div className="flex items-center space-x-6">
              {/* Capital Selector */}
              {capitals.length > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedCapital?.id || ''}
                      onChange={(e) => {
                        const capital = capitals.find(c => c.id === e.target.value);
                        selectCapital(capital);
                      }}
                      className="appearance-none bg-transparent border-none text-lg font-bold text-gray-900 focus:outline-none cursor-pointer pr-8 min-w-0"
                    >
                      {capitals.map(capital => (
                        <option key={capital.id} value={capital.id}>
                          {capital.name}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Balance & Basic Info */}
              {selectedCapital && (
                <div className="flex items-center space-x-6">
                  {/* Balance */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Баланс</div>
                      <button 
                        onClick={() => setShowEditBalanceModal(true)}
                        className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer group flex items-center"
                      >
                        {formatCurrency(selectedCapital.balance)}
                        <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Delete Capital Button */}
              {selectedCapital && (
                <button
                  onClick={() => setShowDeleteCapitalModal(true)}
                  className="w-10 h-10 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 group"
                  title="Удалить капитал"
                >
                  <svg className="w-5 h-5 text-red-600 group-hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {/* Add Capital Button */}
              <Button
                variant="success"
                size="sm"
                onClick={() => setShowAddCapitalModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Капитал</span>
                </div>
              </Button>

              {/* Import Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowImportModal(true)}
                disabled={!selectedCapital}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:transform-none disabled:hover:scale-100"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Импорт</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedCapital ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Капитал не выбран
            </h3>
            <p className="text-gray-600">
              Создайте новый капитал или выберите существующий
            </p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Поиск по имени, товару или ID клиента..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                    activeFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-blue-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h10a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V3a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  <span>Все клиенты ({clients.length})</span>
                </button>

                <button
                  onClick={() => setActiveFilter('today')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                    activeFilter === 'today'
                      ? 'bg-blue-600 text-white shadow-blue-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Сегодня ({filterCounts.todayCount})</span>
                </button>

                <button
                  onClick={() => setActiveFilter('tomorrow')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                    activeFilter === 'tomorrow'
                      ? 'bg-blue-600 text-white shadow-blue-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Завтра ({filterCounts.tomorrowCount})</span>
                </button>

                <button
                  onClick={() => setActiveFilter('overdue')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                    activeFilter === 'overdue'
                      ? 'bg-red-600 text-white shadow-red-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Просрочено ({filterCounts.overdueCount})</span>
                </button>
              </div>
            </div>

            {/* Clients Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 loading-transition ${clientsLoading ? 'loading' : ''}`}>
              {filteredClients.map((client) => (
                <ClientCard key={client.client_id} client={client} />
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'Нет результатов' : 'Нет клиентов'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Попробуйте изменить параметры поиска' : 'Добавьте первого клиента'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        selectedCapital={selectedCapital}
      />

      <AddCapitalModal
        isOpen={showAddCapitalModal}
        onClose={() => setShowAddCapitalModal(false)}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        selectedCapital={selectedCapital}
      />

      <EditBalanceModal
        isOpen={showEditBalanceModal}
        onClose={() => setShowEditBalanceModal(false)}
        capital={selectedCapital}
      />

      <DeleteCapitalModal
        isOpen={showDeleteCapitalModal}
        onClose={() => setShowDeleteCapitalModal(false)}
        capital={selectedCapital}
      />
    </div>
  );
};

export default Dashboard;