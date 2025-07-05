import React, { useState } from 'react';
import { formatCurrency } from '../../utils/helpers';
import ClientDetailsModal from '../modals/ClientDetailsModal';

const ClientCard = ({ client }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Calculate payment progress
  const totalPayments = client.schedule?.length || 0;
  const paidPayments = client.schedule?.filter(p => p.status === 'paid').length || 0;
  const progressPercentage = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0;

  // Check if client is active (has pending payments)
  const isActive = client.schedule?.some(p => p.status === 'pending' || p.status === 'overdue') || false;

  const handleCardClick = () => {
    setShowDetailsModal(true);
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 cursor-pointer animate-fade-in"
        onClick={handleCardClick}
      >
        {/* Header with name and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">👤</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Активен' : 'Завершен'}
          </span>
        </div>

        {/* Product */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">📦</span>
            <span className="text-sm text-gray-600">
              Товар: {client.product || 'не указан'}
            </span>
          </div>
        </div>

        {/* Debt */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">💰 Долг:</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(client.debt_amount || client.total_amount)}
            </span>
          </div>
        </div>

        {/* Phone */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">📞</span>
            <span className="text-sm text-gray-600">
              Телефон: {client.client_phone || 'не указан'}
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">📍</span>
            <span className="text-sm text-gray-600">
              Адрес: {client.client_address || 'не указан'}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Прогресс платежей</span>
            <span className="text-sm font-medium text-gray-900">
              {paidPayments}/{totalPayments}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-gray-500">{progressPercentage}% выполнено</span>
          </div>
        </div>

        {/* Monthly payment */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">📅 Ежемесячный платёж:</span>
            <span className="text-lg font-semibold text-blue-600">
              {formatCurrency(client.monthly_payment)}
            </span>
          </div>
        </div>
      </div>

      {/* Client Details Modal */}
      <ClientDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        client={client}
      />
    </>
  );
};

export default ClientCard;