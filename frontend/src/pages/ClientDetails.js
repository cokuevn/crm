import React, { useEffect, useState } from 'react';
import { getClient, deleteClient as deleteClientApi, updatePaymentStatus as updatePaymentStatusApi, completeClient as completeClientApi, updatePaymentAmount as updatePaymentAmountApi } from '../lib/services/clientsService';
import { Skeleton, SkeletonCircle, SkeletonText } from '../components/ui/Skeleton';
import ProgressBar from '../components/ui/ProgressBar';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import EditClientModal from '../components/modals/EditClientModal';
import useAppStore from '../store/useAppStore';

const ClientDetails = ({ clientId, onBack, capitals }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const invalidateCache = useAppStore(state => state.invalidateCache);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const data = await getClient(clientId);
      setClient(data);
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientUpdated = (updatedClient) => {
    setClient(updatedClient);
    invalidateCache();
  };

  const handleDeleteClient = async () => {
    try {
      await deleteClientApi(clientId);
      invalidateCache();
      onBack(); // Вернуться к списку после удаления
    } catch (error) {
      console.error('Error deleting client:', error);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Ошибка', message: 'Не удалось удалить клиента' } }));
    }
  };

  const handleCompleteClient = async () => {
    try {
      const result = await completeClientApi(clientId);
      setClient(result.client);
      setShowCompleteConfirm(false);
      invalidateCache();
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Успешно', message: 'Клиент отмечен как завершённый' } }));
      // Вернуться к списку после завершения
      setTimeout(() => onBack(), 2000);
    } catch (error) {
      console.error('Error completing client:', error);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Ошибка', message: error.response?.data?.detail || 'Не удалось завершить клиента' } }));
    }
  };

  const updatePaymentStatus = async (paymentDate, status) => {
    try {
      // Normalize payment date format for API call
      const normalizedDate = normalizePaymentDate(paymentDate);
      console.debug('[PaymentStatus] updatePaymentStatus', {
        original: paymentDate,
        originalType: typeof paymentDate,
        originalIsDate: paymentDate instanceof Date,
        normalized: normalizedDate
      });
      console.log('🔍 Payment modal object:', showPaymentModal);
      
      const response = await updatePaymentStatusApi(clientId, normalizedDate, status);
      invalidateCache();
      
      // Update client data immediately if provided in response
      if (response?.client) {
        setClient(response.client);
      } else {
        // Fallback to full refresh if client data not in response
        await fetchClientDetails();
      }
      
      setShowPaymentModal(null);
      
      window.dispatchEvent(new CustomEvent('app:notify', { 
        detail: { 
          type: 'success', 
          title: 'Успешно', 
          message: 'Статус платежа обновлен' 
        } 
      }));
    } catch (error) {
      console.error('Error updating payment status:', error);
      const errorMsg = error.response?.data?.detail || 'Не удалось изменить статус платежа';
      window.dispatchEvent(new CustomEvent('app:notify', { 
        detail: { 
          type: 'error', 
          title: 'Ошибка', 
          message: errorMsg 
        } 
      }));
    }
  };

  const updatePaymentAmount = async (paymentDate) => {
    const current = client?.schedule?.find(p => {
      // Compare dates more flexibly
      try {
        const pDate = parsePaymentDate(p.payment_date);
        const targetDate = parsePaymentDate(paymentDate);
        if (pDate && targetDate) {
          return pDate.getTime() === targetDate.getTime();
        }
      } catch {
        return false;
      }
      return p.payment_date === paymentDate;
    })?.amount;
    
    const input = window.prompt('Введите сумму платежа', current != null ? String(current) : '');
    if (input == null) return;
    const amount = parseFloat(input);
    if (Number.isNaN(amount) || amount < 0) {
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Ошибка', message: 'Введите корректную сумму' } }));
      return;
    }
    try {
      // Normalize payment date format for API call
      const normalizedDate = normalizePaymentDate(paymentDate);
      console.debug('[PaymentStatus] updatePaymentAmount', {
        original: paymentDate,
        normalized: normalizedDate
      });
      
      await updatePaymentAmountApi(clientId, normalizedDate, amount);
      invalidateCache();
      await fetchClientDetails();
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Успешно', message: 'Сумма платежа обновлена' } }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Ошибка', message: error.response?.data?.detail || 'Не удалось обновить сумму' } }));
    }
  };

  // Helper function to safely parse payment date
  const parsePaymentDate = (dateStr) => {
    if (!dateStr) return null;
    
    try {
      // Try ISO format first (YYYY-MM-DD)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateStr + 'T00:00:00');
      }
      
      // Try DD.MM.YY or DD.MM.YYYY format
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        let year = parseInt(parts[2], 10);
        
        // Handle 2-digit year
        if (year < 100) {
          year += 2000; // Assume 2000s
        }
        
        return new Date(year, month, day);
      }
      
      // Fallback to standard Date parsing
      return new Date(dateStr);
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
      return null;
    }
  };

  const normalizePaymentDate = (dateInput) => {
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) return '';
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (typeof dateInput === 'string') {
      return dateInput.trim();
    }

    return dateInput != null ? String(dateInput).trim() : '';
  };

  const getPaymentStatusColor = (payment) => {
    const paymentDate = parsePaymentDate(payment.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!paymentDate || isNaN(paymentDate.getTime())) {
      return 'bg-gray-50/80 backdrop-blur-sm text-gray-800 border-gray-200/50';
    }
    
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
    const paymentDate = parsePaymentDate(payment.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!paymentDate || isNaN(paymentDate.getTime())) {
      return 'Ожидается';
    }
    
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
    const paymentDate = parsePaymentDate(payment.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!paymentDate || isNaN(paymentDate.getTime())) {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
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
    if (!dateStr) return 'Не указана';
    
    try {
      const parsedDate = parsePaymentDate(dateStr);
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        return dateStr; // Return as-is if can't parse
      }
      
      return parsedDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', dateStr, e);
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-gray-200/50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-4 bg-gray-50/80 rounded-2xl">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 items-end">
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            </div>
            <div className="mt-8">
              <Skeleton className="h-4 w-1/3 mb-3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-8">
            <Skeleton className="h-7 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-2 rounded-3xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <SkeletonCircle size={20} />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-full mt-4" />
                </div>
              ))}
            </div>
          </div>
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
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3">
        {/* Header */}
        <div className="mb-3">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-500 mb-3 transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Назад</span>
          </button>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-3">
                  {client.name}
                </h1>
                
                {/* Основная информация */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Товар</p>
                    <p className="text-sm font-semibold text-gray-900">{client.product}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Капитал</p>
                    <p className="text-sm font-semibold text-gray-900">{capital?.name || 'Неизвестно'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Сумма покупки</p>
                    <p className="text-sm font-semibold text-blue-600">{(client.purchase_amount || client.total_amount || 0).toLocaleString()}₽</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Долг клиента</p>
                    <p className="text-sm font-semibold text-red-600">{(client.debt_amount || client.total_amount || 0).toLocaleString()}₽</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Ежемесячный платёж</p>
                    <p className="text-sm font-semibold text-purple-600">{client.monthly_payment?.toLocaleString()}₽</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Телефон</p>
                    <p className="text-sm font-semibold text-gray-900">{client.client_phone || 'Не указан'}</p>
                  </div>
                </div>

                {/* Даты */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Дата начала</p>
                    <p className="text-sm font-semibold text-blue-600">{client.start_date ? formatDate(client.start_date) : 'Не указана'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Дата окончания</p>
                    <p className="text-sm font-semibold text-purple-600">{client.end_date ? formatDate(client.end_date) : 'Не указана'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Дата договора</p>
                    <p className="text-sm font-semibold text-green-600">{client.contract_date ? formatDate(client.contract_date) : 'Не указана'}</p>
                  </div>
                </div>

                {/* Дополнительная информация */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Адрес</p>
                    <p className="text-sm font-semibold text-gray-900">{client.client_address || 'Не указан'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-0.5">Гарант</p>
                    <p className="text-sm font-semibold text-gray-900">{client.guarantor_name || 'Не указан'}</p>
                    {client.guarantor_phone && (
                      <p className="text-xs text-gray-600 mt-0.5">{client.guarantor_phone}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3">
                <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                  client.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : client.status === 'overdue'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status === 'active' ? 'Активен' : 
                   client.status === 'overdue' ? 'Просрочка' : 'Завершён'}
                </span>
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setShowEditModal(true)} variant="primary" size="sm">Редактировать</Button>
                  {client.status !== 'completed' && remainingAmount === 0 && (
                    <Button onClick={() => setShowCompleteConfirm(true)} variant="success" size="sm">
                      Завершить
                    </Button>
                  )}
                  <Button onClick={() => setShowDeleteConfirm(true)} variant="danger" size="sm">Удалить</Button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-2">
                <span>Оплачено: {totalPaid.toLocaleString()}₽</span>
                <span>Осталось: {remainingAmount.toLocaleString()}₽</span>
              </div>
              <ProgressBar value={Math.min(progress, 100)} className="h-3" />
              <p className="text-xs font-semibold text-gray-700 mt-2 text-center">
                {progress.toFixed(1)}% выполнено
              </p>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-3">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              График платежей
            </h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {client.schedule?.map((payment, index) => (
                <div 
                  key={index}
                  className={`border-2 rounded-xl p-3 transition-all duration-300 hover:shadow-lg ${getPaymentStatusColor(payment)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIcon(payment)}
                      <div>
                        <p className="font-bold text-base">
                          {payment.amount?.toLocaleString()}₽
                        </p>
                        <p className="text-xs font-medium opacity-75">
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50">
                      {getPaymentStatusText(payment)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPaymentModal(payment)}
                      className="flex-1 px-3 py-2 bg-white/60 rounded-lg border border-current hover:bg-white/80 transition-all text-xs font-semibold"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Статус</span>
                      </div>
                    </button>
                    <button
                      onClick={() => updatePaymentAmount(payment.payment_date)}
                      className="px-3 py-2 bg-white/60 rounded-lg border border-blue-600 text-blue-700 hover:bg-white/80 transition-all text-xs font-semibold"
                      title="Изменить сумму платежа"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" />
                        </svg>
                        <span>Сумма</span>
                      </div>
                    </button>
                  </div>
                  
                  {payment.status === 'paid' && payment.paid_date && (
                    <p className="text-xs font-medium mt-2 text-center opacity-75">
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="🗑️ Удалить клиента?"
        description={client ? `Вы уверены, что хотите удалить клиента "${client.name}"? Все данные о платежах будут также удалены. Это действие нельзя отменить.` : ''}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteClient();
        }}
      />

      <ConfirmDialog
        isOpen={showCompleteConfirm}
        title="✅ Завершить клиента?"
        description={client ? `Вы уверены, что хотите отметить клиента "${client.name}" как завершённого? Все платежи выполнены, и клиент будет исключён из активных рассрочек.` : ''}
        confirmText="Завершить"
        cancelText="Отмена"
        variant="success"
        onCancel={() => setShowCompleteConfirm(false)}
        onConfirm={() => {
          setShowCompleteConfirm(false);
          handleCompleteClient();
        }}
      />

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
                {showPaymentModal.payment_date}
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

export default ClientDetails