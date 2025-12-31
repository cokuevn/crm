import React, { useEffect, useRef, useState, useMemo } from 'react';
import { fetchAnalytics as fetchAnalyticsService, fetchAnalyticsV2, fetchMonthPaymentsV2 } from '../lib/services/analyticsService';
import { updatePaymentStatus as updatePaymentStatusApi } from '../lib/services/clientsService';
import { exportElementToPdf } from '../lib/utils/pdf';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import ProgressRing from '../components/ui/ProgressRing';
import AnalyticsSummary from '../components/ui/AnalyticsSummary';
import MonthlyProfitChart from '../components/ui/MonthlyProfitChart';
import { Skeleton, SkeletonCircle, SkeletonText } from '../components/ui/Skeleton';
import useAppStore from '../store/useAppStore';

// Arrow Left Icon
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Analytics = ({ selectedCapital, onBack, onClientClick }) => {
  const reportRef = useRef(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsV2, setAnalyticsV2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cashflowGranularity, setCashflowGranularity] = useState('day'); // day | week
  const [expandedAgingBucket, setExpandedAgingBucket] = useState(null); // '1_7' | '8_30' | '31_60' | '60_plus' | null
  const [monthPayments, setMonthPayments] = useState({ month: null, items: [] });
  const [monthPaymentsLoading, setMonthPaymentsLoading] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [includeOverdueInMonthTable, setIncludeOverdueInMonthTable] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'new'
  const { user } = useAuth();

  const { 
    analyticsData: cachedV1, 
    analyticsV2Data: cachedV2,
    monthPaymentsData: cachedMonthPayments,
    setAnalyticsData: setCachedAnalytics,
    setMonthPaymentsData: setCachedMonthPayments,
    isAnalyticsStale
  } = useAppStore();

  useEffect(() => { 
    if (selectedCapital) fetchAnalytics(); 

    // Listen for capital change event to refresh data immediately
    const handleCapitalChange = () => {
      if (selectedCapital) fetchAnalytics(true); // Force refresh
    };

    window.addEventListener('capital:changed', handleCapitalChange);
    return () => window.removeEventListener('capital:changed', handleCapitalChange);
  }, [selectedCapital]);

  const fetchAnalytics = async (force = false) => {
    try {
      // Use cache if not stale and not forced
      if (!force && cachedV1 && cachedV2 && !isAnalyticsStale()) {
        setAnalytics(cachedV1);
        setAnalyticsV2(cachedV2);
        setLoading(false);
        return;
      }

      // Only show loading if we have NO data
      if (!cachedV1) setLoading(true);
      
      const [v1, v2] = await Promise.all([
        fetchAnalyticsService(selectedCapital.id),
        fetchAnalyticsV2(selectedCapital.id),
      ]);
      setAnalytics(v1);
      setAnalyticsV2(v2);
      setCachedAnalytics(v1, v2); // Save to store
    } catch (e) {
      console.error('Error fetching analytics:', e);
      setAnalytics(null);
      setAnalyticsV2(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthPayments = async (force = false) => {
    if (!selectedCapital?.id) return;
    
    // Check cache
    if (!force && cachedMonthPayments && !isAnalyticsStale()) {
      setMonthPayments(cachedMonthPayments);
      return;
    }

    try {
      if (!cachedMonthPayments) setMonthPaymentsLoading(true);
      const data = await fetchMonthPaymentsV2(selectedCapital.id, { includeOverdue: includeOverdueInMonthTable });
      const result = { month: data?.month || null, items: Array.isArray(data?.items) ? data.items : [] };
      setMonthPayments(result);
      setCachedMonthPayments(result); // Save to store
    } catch (e) {
      console.error('Error fetching month payments:', e);
      setMonthPayments({ month: null, items: [] });
    } finally {
      setMonthPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCapital) return;
    fetchMonthPayments();
  }, [selectedCapital, includeOverdueInMonthTable]);

  const handleChangePaymentStatus = async (row, nextStatus) => {
    if (!row?.client_id || !row?.payment_date) return;
    try {
      setUpdatingPaymentId(row.id);
      await updatePaymentStatusApi(row.client_id, encodeURIComponent(row.payment_date), nextStatus);
      await fetchMonthPayments(true); // force refresh cache
      await fetchAnalytics(true); // keep summary metrics in sync
    } catch (e) {
      console.error('Failed to update payment status:', e);
      try {
        window.dispatchEvent(
          new CustomEvent('app:notify', {
            detail: {
              type: 'error',
              title: 'Не удалось обновить статус',
              message: e?.response?.data?.detail || e?.message || 'Ошибка обновления платежа',
            },
          })
        );
      } catch (_) {}
    } finally {
      setUpdatingPaymentId(null);
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

  // Мемоизация вычислений для предотвращения лишних ререндеров
  const collectionRate = useMemo(() => analytics?.collection_rate || 0, [analytics]);
  const paymentCompletionRate = useMemo(() => analytics?.payment_completion_rate || 0, [analytics]);
  const activeClients = useMemo(() => analytics?.active_clients ?? analytics?.total_clients, [analytics]);
  const finishedClients = useMemo(() => analytics?.completed_clients ?? 0, [analytics]);

  const financialSummary = useMemo(() => ({
    totalAmount: analytics?.total_amount || 0,
    totalPaid: analytics?.total_paid || 0,
    toPay: (analytics?.total_amount || 0) - (analytics?.total_paid || 0),
    efficiency: collectionRate,
  }), [analytics, collectionRate]);

  const isV2 = useMemo(() => analyticsV2?.version === 'v2', [analyticsV2]);
  const v2CashflowDay = useMemo(() => Array.isArray(analyticsV2?.cashflow_day) ? analyticsV2.cashflow_day : [], [analyticsV2]);
  const v2CashflowWeek = useMemo(() => Array.isArray(analyticsV2?.cashflow_week) ? analyticsV2.cashflow_week : [], [analyticsV2]);
  const v2Capital = useMemo(() => analyticsV2?.capital || {}, [analyticsV2]);
  const v2Aging = useMemo(() => analyticsV2?.overdue_aging || {}, [analyticsV2]);
  const v2Buckets = useMemo(() => v2Aging?.buckets || {}, [v2Aging]);
  const v2BucketItems = useMemo(() => v2Aging?.items || {}, [v2Aging]);
  const cashflowRows = useMemo(() => cashflowGranularity === 'week' ? v2CashflowWeek : v2CashflowDay, [cashflowGranularity, v2CashflowWeek, v2CashflowDay]);
  const cashflowTitle = useMemo(() => cashflowGranularity === 'week' ? 'Недели' : 'Дни', [cashflowGranularity]);

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    try {
      setPdfExporting(true);
      const cap = selectedCapital?.name ? selectedCapital.name.replace(/[\\/:*?"<>|]+/g, '-') : 'analytics';
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const filename = `analytics_${cap}_${y}-${m}-${day}.pdf`;
      await exportElementToPdf(reportRef.current, { filename });
    } catch (e) {
      console.error('PDF export failed:', e);
      try {
        window.dispatchEvent(
          new CustomEvent('app:notify', {
            detail: {
              type: 'error',
              title: 'PDF не создан',
              message: e?.message || 'Ошибка экспорта PDF',
            },
          })
        );
      } catch (_) {}
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8" ref={reportRef}>
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
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={pdfExporting}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              pdfExporting
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white/80 text-gray-800 border-gray-200/50 hover:bg-white'
            }`}
            title="Скачать PDF отчёт (как на экране)"
          >
            PDF
          </button>
        </div>
      )}
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('main')}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            activeTab === 'main'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white/80 text-gray-700 border-gray-200/50 hover:bg-white'
          }`}
        >
          Основные
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            activeTab === 'new'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white/80 text-gray-700 border-gray-200/50 hover:bg-white'
          }`}
        >
          Новые метрики
        </button>
      </div>

      {activeTab === 'main' && (
        <>
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
              value={`${analytics.overdue_payments?.toLocaleString('ru-RU')} шт. / ${(analytics.total_overdue_amount || 0)?.toLocaleString('ru-RU')}₽`}
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
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">Текущий баланс</span><span className={`text-lg font-semibold ${(analytics.current_balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{(analytics.current_balance || 0).toLocaleString('ru-RU')}₽</span></div>
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">Всего доходов</span><span className="text-lg font-semibold text-green-600">{analytics.total_paid?.toLocaleString('ru-RU')}₽</span></div>
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">Всего расходов</span><span className="text-lg font-semibold text-purple-600">{analytics.total_expenses?.toLocaleString('ru-RU')}₽</span></div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200"><span className="text-sm font-medium text-gray-900">Чистая прибыль</span><span className={`text-lg font-semibold ${(analytics.net_income || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(analytics.net_income || 0).toLocaleString('ru-RU')}₽</span></div>
              </div>
            </div>
          </div>

          {/* Current Month Statistics */}
          {analytics.current_month_stats && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Статистика за текущий месяц ({new Date().toLocaleString('ru', { month: 'long' })})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-sm text-blue-700 font-medium mb-1">Всего к оплате</div>
                  <div className="text-2xl font-bold text-blue-900">{analytics.current_month_stats.total.toLocaleString('ru-RU')}₽</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="text-sm text-green-700 font-medium mb-1">Оплачено</div>
                  <div className="text-2xl font-bold text-green-900">{analytics.current_month_stats.paid.toLocaleString('ru-RU')}₽</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <div className="text-sm text-amber-700 font-medium mb-1">Осталось получить</div>
                  <div className="text-2xl font-bold text-amber-900">{analytics.current_month_stats.unpaid.toLocaleString('ru-RU')}₽</div>
                </div>
              </div>
            </div>
          )}

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
                <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-medium">Сумма просрочек</span>
                  </div>
                  <span className="font-bold text-xl tabular-nums">{(analytics.total_overdue_amount || 0).toLocaleString('ru-RU')}₽</span>
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
        </>
      )}

      {activeTab === 'new' && (
        <>
          {!isV2 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-sm text-gray-700">
              Новые метрики пока недоступны (нет данных v2).
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">План/Факт кэшфлоу (текущий месяц)</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCashflowGranularity('day')}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        cashflowGranularity === 'day'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Дни
                    </button>
                    <button
                      onClick={() => setCashflowGranularity('week')}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        cashflowGranularity === 'week'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Недели
                    </button>
                  </div>
                </div>
                {cashflowRows.length === 0 ? (
                  <div className="text-sm text-gray-600">Нет данных</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white sticky top-0">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-gray-600">{cashflowTitle}</th>
                          <th className="text-right py-2 px-2 text-gray-600">План</th>
                          <th className="text-right py-2 px-2 text-gray-600">Факт</th>
                          <th className="text-right py-2 px-2 text-gray-600">Откл.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashflowRows.map((row) => (
                          <tr key={row.period} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2 px-2 text-gray-900 tabular-nums">{row.period}</td>
                            <td className="py-2 px-2 text-right tabular-nums">{(row.planned || 0).toLocaleString('ru-RU')}₽</td>
                            <td className="py-2 px-2 text-right tabular-nums">{(row.actual || 0).toLocaleString('ru-RU')}₽</td>
                            <td className={`py-2 px-2 text-right tabular-nums ${(row.variance || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {(row.variance || 0) >= 0 ? '+' : ''}{(row.variance || 0).toLocaleString('ru-RU')}₽
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Просрочки (aging)</h3>
                <div className="space-y-3">
                  {[
                    { k: '1_7', label: '1–7 дней' },
                    { k: '8_30', label: '8–30 дней' },
                    { k: '31_60', label: '31–60 дней' },
                    { k: '60_plus', label: '60+ дней' },
                  ].map(({ k, label }) => {
                    const b = v2Buckets[k] || { amount: 0, share: 0 };
                    const isOpen = expandedAgingBucket === k;
                    const items = Array.isArray(v2BucketItems?.[k]) ? v2BucketItems[k] : [];
                    return (
                      <div key={k} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedAgingBucket((prev) => (prev === k ? null : k))}
                          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="text-sm font-medium text-gray-900">{label}</div>
                          <div className="text-sm text-gray-700 tabular-nums flex items-center gap-3">
                            <span>{(b.amount || 0).toLocaleString('ru-RU')}₽ • {((b.share || 0) * 100).toFixed(2)}%</span>
                            <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-4 py-3 bg-white">
                            {items.length === 0 ? (
                              <div className="text-sm text-gray-600">Нет клиентов</div>
                            ) : (
                              <div className="space-y-2">
                                {items.map((it) => (
                                  <button
                                    key={it.client_id}
                                    type="button"
                                    onClick={() => onClientClick && onClientClick(it.client_id)}
                                    className="w-full text-left flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 transition-colors"
                                    title="Открыть детали клиента"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {it.name || it.client_id}
                                      </div>
                                      <div className="text-xs text-gray-600 truncate">
                                        {it.product || '—'} • ID {String(it.client_id).slice(0, 8)}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold text-gray-900 tabular-nums">
                                        {(it.overdue_amount || 0).toLocaleString('ru-RU')}₽
                                      </div>
                                      <div className="text-xs text-gray-600 tabular-nums">
                                        DPD {it.max_overdue_days || 0} • {it.overdue_count || 0} плат.
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 flex items-center justify-between">
                  <span>Итого outstanding</span>
                  <span className="tabular-nums">{(v2Aging.total_outstanding || 0).toLocaleString('ru-RU')}₽</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Платежи текущего месяца</h3>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={includeOverdueInMonthTable}
                        onChange={(e) => setIncludeOverdueInMonthTable(e.target.checked)}
                      />
                      Показать просрочки прошлых месяцев
                    </label>
                    <div className="text-sm text-gray-600 tabular-nums">
                      {monthPayments?.month ? `Месяц: ${monthPayments.month}` : ''}
                    </div>
                  </div>
                </div>

                {monthPaymentsLoading ? (
                  <div className="text-sm text-gray-600">Загрузка…</div>
                ) : monthPayments.items.length === 0 ? (
                  <div className="text-sm text-gray-600">Нет платежей в этом месяце</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white sticky top-0">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 text-gray-600">Дата</th>
                          <th className="text-left py-2 px-2 text-gray-600">Клиент</th>
                          <th className="text-left py-2 px-2 text-gray-600">Товар</th>
                          <th className="text-right py-2 px-2 text-gray-600">Сумма</th>
                          <th className="text-left py-2 px-2 text-gray-600">Статус</th>
                          <th className="text-left py-2 px-2 text-gray-600">Оплачен</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthPayments.items.map((row) => {
                          const isOverdue = row.computed_status === 'overdue';
                          const isUpdating = updatingPaymentId === row.id;
                          const badge =
                            row.status === 'paid'
                              ? { cls: 'bg-green-100 text-green-700', label: 'paid' }
                              : isOverdue
                                ? { cls: 'bg-red-100 text-red-700', label: 'overdue' }
                                : { cls: 'bg-amber-100 text-amber-800', label: 'pending' };

                          return (
                            <tr
                              key={row.id}
                              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/40' : ''}`}
                            >
                              <td className="py-2 px-2 text-gray-900 tabular-nums">{row.payment_date}</td>
                              <td className="py-2 px-2">
                                <button
                                  type="button"
                                  className="text-left hover:underline text-gray-900 font-medium"
                                  onClick={() => onClientClick && onClientClick(row.client_id)}
                                  title="Открыть детали клиента"
                                >
                                  {row.client_name || `ID ${String(row.client_id).slice(0, 8)}`}
                                </button>
                              </td>
                              <td className="py-2 px-2 text-gray-700">{row.product || '—'}</td>
                              <td className="py-2 px-2 text-right tabular-nums font-medium text-gray-900">
                                {(row.amount || 0).toLocaleString('ru-RU')}₽
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                                    {badge.label}
                                  </span>
                                  <select
                                    value={row.status}
                                    disabled={isUpdating}
                                    onChange={(e) => handleChangePaymentStatus(row, e.target.value)}
                                    className={`text-sm border rounded-lg px-2 py-1 bg-white ${
                                      isUpdating ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-300'
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="pending">pending</option>
                                    <option value="paid">paid</option>
                                    <option value="overdue">overdue</option>
                                  </select>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-gray-700 tabular-nums">{row.paid_date || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;

