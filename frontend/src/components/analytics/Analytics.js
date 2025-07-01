import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Analytics = () => {
  const { selectedCapital, analytics, loadAnalytics, loading } = useApp();

  useEffect(() => {
    if (selectedCapital) {
      loadAnalytics(selectedCapital.id);
    }
  }, [selectedCapital, loadAnalytics]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedCapital) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Капитал не выбран
        </h3>
        <p className="text-gray-600">
          Выберите капитал в верхней части страницы для просмотра аналитики
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Аналитика: {selectedCapital.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Детальная статистика по капиталу и клиентам
        </p>
      </div>

      {/* Analytics Content */}
      {analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder analytics cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              📊 Общая статистика
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего клиентов:</span>
                <span className="font-medium">{analytics.total_clients || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Активные рассрочки:</span>
                <span className="font-medium">{analytics.active_installments || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Завершенные:</span>
                <span className="font-medium text-green-600">{analytics.completed_installments || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              💰 Финансы
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Общий оборот:</span>
                <span className="font-medium">{analytics.total_turnover || 0} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Собрано платежей:</span>
                <span className="font-medium text-green-600">{analytics.collected_payments || 0} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Задолженность:</span>
                <span className="font-medium text-red-600">{analytics.total_debt || 0} ₽</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ⚠️ Просрочки
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Просроченные платежи:</span>
                <span className="font-medium text-red-600">{analytics.overdue_payments || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Сумма просрочек:</span>
                <span className="font-medium text-red-600">{analytics.overdue_amount || 0} ₽</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500">
            Загрузка аналитики...
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;