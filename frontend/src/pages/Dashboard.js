import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchDashboard } from '../lib/services/dashboardService';
import { Skeleton, SkeletonCircle, SkeletonText } from '../components/ui/Skeleton';
import ProgressBar from '../components/ui/ProgressBar';
import ClientCard from '../components/ui/ClientCard';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import useAppStore from '../store/useAppStore';

// Minimal icon set used in dashboard (to avoid coupling with App.js)
const Icons = {
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Money: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  Grid: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Device: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Location: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const PaymentProgress = React.memo(function PaymentProgress({ client }) {
  const total = client.debt_amount || client.total_amount || 0;
  const paid = client.schedule?.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0) || 0;
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  return (
    <div>
      <ProgressBar value={pct} />
      <div className="text-xs text-gray-600 mt-1 text-right">{pct.toFixed(1)}%</div>
    </div>
  );
});

const Dashboard = ({ selectedCapital, onClientClick }) => {
  const [dashboardData, setDashboardData] = useState({
    today: [],
    tomorrow: [],
    overdue: [],
    all_clients: [],
    completed_clients: []
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [visibleCount, setVisibleCount] = useState(9);
  const sentinelRef = useRef(null);
  const handleCardClick = useCallback((id) => onClientClick(id), [onClientClick]);
  const clearSearch = useCallback(() => setSearchTerm(''), []);
  const setFilterAll = useCallback(() => setFilter('all'), []);
  const setFilterToday = useCallback(() => setFilter('today'), []);
  const setFilterTomorrow = useCallback(() => setFilter('tomorrow'), []);
  const setFilterOverdue = useCallback(() => setFilter('overdue'), []);
  const setFilterCompleted = useCallback(() => setFilter('completed'), []);

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
      const data = await fetchDashboard(selectedCapital.id);
      console.log('Dashboard data received:', data); // Отладочная информация
      setDashboardData(data);
      
      // Update Zustand store with clients for overdueCount
      const allClients = [...(data.all_clients || []), ...(data.completed_clients || [])];
      useAppStore.getState().setClients(allClients);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const baseClients = dashboardData.all_clients || [];
    const completedClients = dashboardData.completed_clients || [];
    let result = [];

    if (filter === 'today') {
      const items = dashboardData.today || [];
      const ids = new Set(items.map((i) => i.client.client_id));
      result = baseClients.filter((c) => ids.has(c.client_id)).map((c) => ({ ...c, filterReason: 'Платёж сегодня' }));
    } else if (filter === 'tomorrow') {
      const items = dashboardData.tomorrow || [];
      console.log('Tomorrow filter - items:', items); // Отладочная информация
      const ids = new Set(items.map((i) => i.client.client_id));
      result = baseClients.filter((c) => ids.has(c.client_id)).map((c) => ({ ...c, filterReason: 'Платёж завтра' }));
    } else if (filter === 'overdue') {
      const items = dashboardData.overdue || [];
      const ids = new Set(items.map((i) => i.client.client_id));
      result = baseClients.filter((c) => ids.has(c.client_id)).map((c) => ({ ...c, filterReason: 'Просроченный платёж' }));
    } else if (filter === 'completed') {
      result = completedClients.map((c) => ({ ...c, filterReason: 'Завершённый клиент' }));
    } else {
      result = baseClients.slice();
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((client) =>
        client.name?.toLowerCase().includes(q) ||
        client.product?.toLowerCase().includes(q) ||
        client.client_id?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [dashboardData, filter, searchTerm]);

  // Increase visible items when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((count) => Math.min(count + 9, filteredClients.length));
          }
        });
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredClients.length]);

  // Reset visible count on filter or search change
  useEffect(() => {
    setVisibleCount(9);
  }, [filter, searchTerm, selectedCapital]);

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
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Skeleton className="h-11 rounded-xl" />
            </div>
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-44 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <SkeletonCircle size={40} />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-3 mb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-2 w-full" />
              <div className="pt-4">
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern iOS-style Search Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-3 sm:p-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Поиск по имени, товару или ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-gray-50/80 border-0 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 placeholder-gray-500 text-sm sm:text-base"
            />
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <div className="text-gray-400">
                <Icons.Search />
              </div>
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icons.Close />
            </button>
          )}
        </div>
      </div>

      {/* iOS-style Filter Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2">
        <button
          onClick={setFilterAll}
          className={`px-3 sm:px-5 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.Grid />
          <span className="hidden sm:inline">Все клиенты ({dashboardData.all_clients?.length || 0})</span>
          <span className="sm:hidden">Все ({dashboardData.all_clients?.length || 0})</span>
        </button>
        <button
          onClick={setFilterToday}
          className={`px-3 sm:px-5 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap ${
            filter === 'today'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.Calendar />
          <span>Сегодня ({dashboardData.today?.length || 0})</span>
        </button>
        <button
          onClick={setFilterTomorrow}
          className={`px-3 sm:px-5 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap ${
            filter === 'tomorrow'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.Clock />
          <span>Завтра ({dashboardData.tomorrow?.length || 0})</span>
        </button>
        <button
          onClick={setFilterOverdue}
          className={`px-3 sm:px-5 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap ${
            filter === 'overdue'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.Warning />
          <span>Просрочено ({dashboardData.overdue?.length || 0})</span>
        </button>
        <button
          onClick={setFilterCompleted}
          className={`px-3 sm:px-5 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap ${
            filter === 'completed'
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
          }`}
        >
          <Icons.CheckCircle />
          <span className="hidden sm:inline">Завершённые ({dashboardData.completed_clients?.length || 0})</span>
          <span className="sm:hidden">Завершён. ({dashboardData.completed_clients?.length || 0})</span>
        </button>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-800">
              <Icons.Search />
              <span>Поиск: "{searchTerm}" • Найдено: {filteredClients.length} клиентов</span>
            </div>
            {filteredClients.length === 0 && (
              <button
                onClick={clearSearch}
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
            {searchTerm ? <Icons.Search /> : filter === 'today' ? <Icons.Calendar /> : filter === 'tomorrow' ? <Icons.Clock /> : filter === 'overdue' ? <Icons.Warning /> : filter === 'completed' ? <Icons.CheckCircle /> : <Icons.Grid />}
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
                    : filter === 'completed'
                      ? 'Нет завершённых клиентов'
                      : 'Нет клиентов'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Попробуйте изменить поисковый запрос'
              : filter === 'all' 
                ? 'Добавьте первого клиента'
                : filter === 'completed'
                  ? 'Завершённые клиенты появятся здесь после полной оплаты'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredClients.slice(0, visibleCount).map((client) => (
              <ClientCard key={client.client_id} client={client} onClick={handleCardClick} />
            ))}
          </div>
          {visibleCount < filteredClients.length && (
            <div ref={sentinelRef} className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleCount((c) => Math.min(c + 9, filteredClients.length))}
                className="px-4 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Показать ещё
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
