import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import AddCapitalModal from '../modals/AddCapitalModal';
import ImportModal from '../modals/ImportModal';
import { PAGES } from '../../constants/api';

const Analytics = () => {
  const { user, logout } = useAuth();
  const { 
    selectedCapital, 
    capitals,
    selectCapital,
    analytics, 
    clients,
    expenses,
    loadAnalytics,
    loadClients,
    loadExpenses,
    loading,
    currentPage,
    setCurrentPage
  } = useApp();

  const [showAddCapitalModal, setShowAddCapitalModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (selectedCapital) {
      loadAnalytics(selectedCapital.id);
      loadClients(selectedCapital.id);
      loadExpenses(selectedCapital.id);
    }
  }, [selectedCapital, loadAnalytics, loadClients, loadExpenses]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!clients.length) return null;

    const totalClients = clients.length;
    const totalAmount = clients.reduce((sum, client) => 
      sum + (client.debt_amount || client.total_amount || 0), 0);
    
    const collectedAmount = clients.reduce((sum, client) => {
      const paidPayments = client.schedule?.filter(p => p.status === 'paid') || [];
      return sum + paidPayments.reduce((paySum, payment) => 
        paySum + (payment.amount || 0), 0);
    }, 0);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const overduePayments = clients.reduce((sum, client) => {
      const overdue = client.schedule?.filter(p => p.status === 'overdue') || [];
      return sum + overdue.length;
    }, 0);

    const collectionPercent = totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;
    
    const totalPayments = clients.reduce((sum, client) => 
      sum + (client.schedule?.length || 0), 0);
    const paidPayments = clients.reduce((sum, client) => 
      sum + (client.schedule?.filter(p => p.status === 'paid').length || 0), 0);
    const paymentCompletionPercent = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

    const activeClients = clients.filter(client => 
      client.schedule?.some(p => p.status === 'pending' || p.status === 'overdue')).length;
    const completedClients = totalClients - activeClients;

    const toPayAmount = totalAmount - collectedAmount;
    const netProfit = collectedAmount - totalExpenses;
    const efficiency = totalAmount > 0 ? collectionPercent : 0;

    return {
      totalClients,
      totalAmount,
      collectedAmount,
      totalExpenses,
      overduePayments,
      collectionPercent,
      paymentCompletionPercent,
      activeClients,
      completedClients,
      toPayAmount,
      netProfit,
      efficiency
    };
  }, [clients, expenses]);

  // Generate monthly profit data (mock for now)
  const monthlyProfitData = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return months.map(month => ({
      month,
      profit: Math.floor(Math.random() * 500000) + 100000
    }));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
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

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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
                    ? 'text-white bg-blue-600'
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

              <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100">
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
              {selectedCapital && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">💰</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(selectedCapital.balance)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="success" size="sm" onClick={() => setShowAddCapitalModal(true)}>
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
        ) : !analyticsData ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет данных для аналитики
            </h3>
            <p className="text-gray-600">
              Добавьте клиентов для просмотра аналитики
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <StatsCard
                title="Всего клиентов"
                value={analyticsData.totalClients}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                color="blue"
              />
              <StatsCard
                title="Общая сумма"
                value={formatCurrency(analyticsData.totalAmount)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
                color="green"
              />
              <StatsCard
                title="Собрано средств"
                value={formatCurrency(analyticsData.collectedAmount)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="green"
              />
              <StatsCard
                title="Всего расходов"
                value={formatCurrency(analyticsData.totalExpenses)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                color="purple"
              />
              <StatsCard
                title="Просрочено"
                value={analyticsData.overduePayments}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
                color="red"
              />
            </div>

            {/* Charts and Financial Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Circular Charts */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <CircularChart
                  title="Процент сбора"
                  percentage={analyticsData.collectionPercent}
                  subtitle={`Собрано ${formatCurrency(analyticsData.collectedAmount)} из ${formatCurrency(analyticsData.totalAmount)}`}
                />
                <CircularChart
                  title="Выполнение платежей"
                  percentage={analyticsData.paymentCompletionPercent}
                  subtitle={`Оплачено ${Math.round(analyticsData.paymentCompletionPercent)}% из всех платежей`}
                />
              </div>

              {/* Financial Balance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Финансовый баланс</h3>
                <div className="space-y-4">
                  <BalanceRow 
                    label="Текущий баланс" 
                    value={formatCurrency(selectedCapital.balance)} 
                    color="blue"
                  />
                  <BalanceRow 
                    label="Всего доходов" 
                    value={formatCurrency(analyticsData.collectedAmount)} 
                    color="green"
                  />
                  <BalanceRow 
                    label="Всего расходов" 
                    value={formatCurrency(analyticsData.totalExpenses)} 
                    color="purple"
                  />
                  <hr />
                  <BalanceRow 
                    label="Чистая прибыль" 
                    value={formatCurrency(analyticsData.netProfit)} 
                    color={analyticsData.netProfit >= 0 ? "green" : "red"}
                  />
                </div>
              </div>
            </div>

            {/* Monthly Profit Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Статистика прибыли по месяцам</h3>
              <MonthlyProfitChart data={monthlyProfitData} />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Client Status */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Статус клиентов</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Активные</span>
                      <span className="font-semibold">{analyticsData.activeClients}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Завершенные</span>
                      <span className="font-semibold">{analyticsData.completedClients}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Финансовая сводка</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-medium">Общая сумма</span>
                      <span className="font-semibold">{formatCurrency(analyticsData.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-medium">Оплачено</span>
                      <span className="font-semibold">{formatCurrency(analyticsData.collectedAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-medium">К оплате</span>
                      <span className="font-semibold">{formatCurrency(analyticsData.toPayAmount)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600 font-medium">Эффективность</span>
                      <span className="font-semibold">{analyticsData.efficiency.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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

// Stats Card Component
const StatsCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    red: 'bg-red-50 border-red-200 text-red-600'
  };

  return (
    <div className={`bg-white rounded-lg border-2 ${colorClasses[color]} p-6 text-center`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

// Circular Chart Component
const CircularChart = ({ title, percentage, subtitle }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-green-500 transition-all duration-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4">{subtitle}</p>
    </div>
  );
};

// Balance Row Component
const BalanceRow = ({ label, value, color = 'gray' }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    gray: 'text-gray-900'
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${colorClasses[color]}`}>{value}</span>
    </div>
  );
};

// Monthly Profit Chart Component
const MonthlyProfitChart = ({ data }) => {
  const maxProfit = Math.max(...data.map(d => d.profit));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-2">
        {data.map((month, index) => {
          const height = (month.profit / maxProfit) * 200;
          return (
            <div key={index} className="flex flex-col items-center">
              <div className="w-full bg-gray-200 rounded-t" style={{ height: '200px' }}>
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all duration-500"
                  style={{ 
                    height: `${height}px`,
                    marginTop: `${200 - height}px`
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-2">{month.month}</div>
              <div className="text-xs font-medium text-gray-900">
                {formatCurrency(month.profit)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Analytics;