import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import PaymentStatusBadge from '../common/PaymentStatusBadge';
import ClientDetailsModal from '../modals/ClientDetailsModal';
import Button from '../common/Button';

const ClientsList = () => {
  const { clients, deleteClient } = useApp();
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
      try {
        await deleteClient(clientId);
      } catch (error) {
        console.error('Failed to delete client:', error);
      }
    }
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Нет клиентов</h3>
        <p className="mt-1 text-sm text-gray-500">
          Добавьте первого клиента или импортируйте данные из Excel
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Клиент
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Товар
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Долг
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ежемесячный платеж
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Следующий платеж
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => {
              const nextPayment = client.schedule?.find(p => p.status === 'pending');
              const hasOverdue = client.schedule?.some(p => p.status === 'overdue');
              
              return (
                <tr key={client.client_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {client.name}
                      </div>
                      {client.client_phone && (
                        <div className="text-sm text-gray-500">
                          {client.client_phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.product}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(client.debt_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(client.monthly_payment)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentStatusBadge 
                      status={hasOverdue ? 'overdue' : 'pending'} 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {nextPayment ? (
                      <div className="text-sm text-gray-900">
                        {formatDate(nextPayment.payment_date)}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Нет платежей
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClient(client)}
                      >
                        Просмотр
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteClient(client.client_id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Client Details Modal */}
      <ClientDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        client={selectedClient}
      />
    </>
  );
};

export default ClientsList;