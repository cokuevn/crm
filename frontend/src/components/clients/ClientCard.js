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
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        onClick={handleCardClick}
      >
        {/* Header with name and status */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            {isActive ? 'Активен' : 'Завершен'}
          </span>
        </div>

        {/* Product */}
        <div className="mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <span className="text-sm text-gray-500">Товар</span>
              <p className="text-sm font-medium text-gray-900">
                {client.product || 'не указан'}
              </p>
            </div>
          </div>
        </div>

        {/* Debt */}
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-sm font-medium text-green-700">Долг</span>
            </div>
            <span className="text-lg font-bold text-green-800">
              {formatCurrency(client.debt_amount || client.total_amount)}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-gray-500">Телефон</span>
              <p className="text-sm font-medium text-gray-900">
                {client.client_phone || 'не указан'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-gray-500">Адрес</span>
              <p className="text-sm font-medium text-gray-900">
                {client.client_address || 'не указан'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Прогресс платежей</span>
            <span className="text-sm font-bold text-gray-900">
              {paidPayments}/{totalPayments}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right mt-2">
            <span className="text-xs font-medium text-gray-600">{progressPercentage}% выполнено</span>
          </div>
        </div>

        {/* Monthly payment */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Ежемесячный платёж</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
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