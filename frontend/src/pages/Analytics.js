import React, { useEffect, useState } from 'react';
import { fetchAnalytics as fetchAnalyticsService } from '../lib/services/analyticsService';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import ProgressRing from '../components/ui/ProgressRing';
import AnalyticsSummary from '../components/ui/AnalyticsSummary';
import MonthlyProfitChart from '../components/ui/MonthlyProfitChart';
import { Skeleton, SkeletonCircle, SkeletonText } from '../components/ui/Skeleton';

// Arrow Left Icon
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Analytics = ({ selectedCapital, onBack }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { if (selectedCapital) fetchAnalytics(); }, [selectedCapital]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await fetchAnalyticsService(selectedCapital.id);
      console.log('Analytics data received:', data); // Отладочная информация
      console.log('Completed clients count:', data.completed_clients); // Отладочная информация для завершенных клиентов
      setAnalytics(data);
    } catch (e) {
      console.error('Error fetching analytics:', e);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile Header with Back Button */}
        {onBack && (
          <div className="flex items-center space-x-4 mb-4 sm:mb-6">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 text-gray-700 hover:bg-white transition-all duration-200"
              aria-label="Назад"
            >
              <ArrowLeftIcon />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">Аналитика</h1>
              <p className="text-sm text-gray-600">{selectedCapital?.name || 'Статистика'}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="ml-4 flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <Skeleton className="h-5 w-40 mb-6" />
                <div className="flex items-center justify-center">
                  <SkeletonCircle size={120} />
                </div>
                <div className="mt-4">
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile Header with Back Button */}
        {onBack && (
          <div className="flex items-center space-x-4 mb-4 sm:mb-6">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 text-gray-700 hover:bg-white transition-all duration-200"
              aria-label="Назад"
            >
              <ArrowLeftIcon />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">Аналитика</h1>
              <p className="text-sm text-gray-600">{selectedCapital?.name || 'Статистика'}</p>
            </div>
          </div>
        )}
        
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных для аналитики</h3>
          <p className="text-gray-600">Добавьте клиентов для отображения аналитики</p>
        </div>
      </div>
    );
  }

  const collectionRate = analytics.collection_rate || 0;
  const paymentCompletionRate = analytics.payment_completion_rate || 0;
  const activeClients = analytics.active_clients ?? analytics.total_clients; // fallback
  const finishedClients = analytics.completed_clients ?? 0;

  const financialSummary = {
    totalAmount: analytics.total_amount || 0,
    totalPaid: analytics.total_paid || 0,
    toPay: (analytics.total_amount || 0) - (analytics.total_paid || 0),
    efficiency: collectionRate,
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Mobile Header with Back Button */}
      {onBack && (
        <div className="flex items-center space-x-4 mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200/50 text-gray-700 hover:bg-white transition-all duration-200"
            aria-label="Назад"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Аналитика</h1>
            <p className="text-sm text-gray-600">{selectedCapital?.name || 'Статистика'}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
        <AnalyticsSummary
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>}
          bgColor="bg-blue-100"
          textColor="text-gray-900"
          label="Клиенты"
          value={analytics.total_clients?.toLocaleString('ru-RU')}
        />
        <AnalyticsSummary
          icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>}
          bgColor="bg-green-100"
          textColor="text-gray-900"
          label="Сумма"
          value={`${analytics.total_amount?.toLocaleString('ru-RU')}₽`}
        />
        <AnalyticsSummary
          icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          bgColor="bg-emerald-100"
          textColor="text-emerald-600"
          label="Собрано"
          value={`${analytics.total_paid?.toLocaleString('ru-RU')}₽`}
        />
        <AnalyticsSummary
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>}
          bgColor="bg-purple-100"
          textColor="text-purple-600"
          label="Расходы"
          value={`${analytics.total_expenses?.toLocaleString('ru-RU')}₽`}
        />
        <AnalyticsSummary
          icon={<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>}
          bgColor="bg-red-100"
          textColor="text-red-600"
          label="Просроченные"
          value={analytics.overdue_payments?.toLocaleString('ru-RU')}
        />
        <AnalyticsSummary
          icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>}
          bgColor="bg-emerald-100"
          textColor="text-emerald-600"
          label="Общая прибыль"
          value={`${analytics.total_profit?.toLocaleString('ru-RU')}₽`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Процент сбора</h3>
          <div className="flex items-center justify-center">
            <ProgressRing progress={collectionRate} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Собрано {analytics.total_paid?.toLocaleString('ru-RU')}₽ из {analytics.total_amount?.toLocaleString('ru-RU')}₽</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Выполнение платежей</h3>
          <div className="flex items-center justify-center">
            <ProgressRing progress={paymentCompletionRate} color="emerald" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Оплачено {analytics.paid_payments?.toLocaleString('ru-RU')} из {analytics.total_payments?.toLocaleString('ru-RU')} платежей</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Финансовый баланс</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">Текущий баланс</span><span className="text-lg font-semibold text-blue-600">{analytics.current_balance?.toLocaleString('ru-RU')}₽</span></div>
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">Всего доходов</span><span className="text-lg font-semibold text-green-600">{analytics.total_paid?.toLocaleString('ru-RU')}₽</span></div>
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">Всего расходов</span><span className="text-lg font-semibold text-purple-600">{analytics.total_expenses?.toLocaleString('ru-RU')}₽</span></div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200"><span className="text-sm font-medium text-gray-900">Чистая прибыль</span><span className={`text-lg font-semibold ${(analytics.net_income || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(analytics.net_income || 0).toLocaleString('ru-RU')}₽</span></div>
          </div>
        </div>
      </div>

      {/* Status and Financial Summary blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Client Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Статус клиентов</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Активные</span>
              </div>
              <span className="font-bold text-xl tabular-nums">{(analytics.active_clients ?? analytics.total_clients)?.toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 text-gray-700 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="font-medium">Завершённые</span>
              </div>
              <span className="font-bold text-xl tabular-nums">{(analytics.completed_clients || 0).toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="font-medium">Просроченные</span>
              </div>
              <span className="font-bold text-xl tabular-nums">{(analytics.overdue_payments ?? 0)?.toLocaleString('ru-RU')}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Финансовая сводка</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 text-blue-700 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-medium">Общая сумма</span>
              </div>
              <span className="font-bold text-xl tabular-nums">{(analytics.total_amount || 0).toLocaleString('ru-RU')}₽</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Собрано</span>
              </div>
              <span className="font-bold text-xl tabular-nums">{(analytics.total_paid || 0).toLocaleString('ru-RU')}₽</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 text-amber-700 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="font-medium">К оплате</span>
              </div>
              <span className="font-bold text-xl tabular-nums">{((analytics.total_amount || 0) - (analytics.total_paid || 0)).toLocaleString('ru-RU')}₽</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-purple-50 border border-purple-200 text-purple-700 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="font-medium">Эффективность</span>
              </div>
              <span className="font-bold text-xl tabular-nums">{collectionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Profit Chart */}
      <MonthlyProfitChart monthlyProfits={analytics.monthly_profits || []} />
    </div>
  );
};

export default Analytics;

