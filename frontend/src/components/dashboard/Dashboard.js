import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import ClientCard from '../clients/ClientCard';
import AddClientModal from '../modals/AddClientModal';
import AddCapitalModal from '../modals/AddCapitalModal';
import ImportModal from '../modals/ImportModal';
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
  const filteredClients = clients.filter(client => {
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

  // Calculate filter counts
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
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">CRM Рассрочка</h1>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-gray-900">{user?.email}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
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

      {/* Capital Info */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Capital selector */}
              {capitals.length > 0 && (
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedCapital?.id || ''}
                    onChange={(e) => {
                      const capital = capitals.find(c => c.id === e.target.value);
                      selectCapital(capital);
                    }}
                    className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {capitals.map(capital => (
                      <option key={capital.id} value={capital.id}>
                        {capital.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Capital balance */}
              {selectedCapital && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">💰</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(selectedCapital.balance)}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <Button
                variant="success"
                size="sm"
                onClick={() => setShowAddCapitalModal(true)}
              >
                <div className="flex items-center space-x-2">
                  <span>➕</span>
                  <span>Капитал</span>
                </div>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowImportModal(true)}
                disabled={!selectedCapital}
              >
                <div className="flex items-center space-x-2">
                  <span>📥</span>
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>📋</span>
                  <span>Все клиенты ({clients.length})</span>
                </button>

                <button
                  onClick={() => setActiveFilter('today')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'today'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>📅</span>
                  <span>Сегодня ({todayCount})</span>
                </button>

                <button
                  onClick={() => setActiveFilter('tomorrow')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'tomorrow'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>⏰</span>
                  <span>Завтра ({tomorrowCount})</span>
                </button>

                <button
                  onClick={() => setActiveFilter('overdue')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'overdue'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>⚠️</span>
                  <span>Просрочено ({overdueCount})</span>
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
    </div>
  );
};

export default Dashboard;