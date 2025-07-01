import React, { useState } from 'react';
import { clientService } from '../../services/clientService';
import { formatCurrency, formatDate, getDaysUntilPayment } from '../../utils/helpers';
import Modal from '../common/Modal';
import PaymentStatusBadge from '../common/PaymentStatusBadge';
import Button from '../common/Button';

const ClientDetailsModal = ({ isOpen, onClose, client }) => {
  const [loading, setLoading] = useState(false);

  if (!client) return null;

  const handleUpdatePaymentStatus = async (paymentDate, newStatus) => {
    setLoading(true);
    try {
      await clientService.updatePaymentStatus(client.client_id, paymentDate, newStatus);
      // Note: In a real app, you'd want to update the client data in the context
      // For now, we'll just show success
      alert('Статус платежа обновлен');
    } catch (error) {
      console.error('Failed to update payment status:', error);
      alert('Ошибка при обновлении статуса платежа');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentRowColor = (payment) => {
    const daysUntil = getDaysUntilPayment(payment.payment_date);
    
    if (payment.status === 'paid') return 'bg-green-50';
    if (payment.status === 'overdue') return 'bg-red-50';
    if (daysUntil <= 3 && daysUntil >= 0) return 'bg-yellow-50';
    return '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Клиент: ${client.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Client Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Информация о клиенте</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">ФИО:</span>
              <span className="ml-2 text-gray-900">{client.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Товар:</span>
              <span className="ml-2 text-gray-900">{client.product}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Сумма покупки:</span>
              <span className="ml-2 text-gray-900">{formatCurrency(client.purchase_amount)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Долг:</span>
              <span className="ml-2 text-gray-900">{formatCurrency(client.debt_amount)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Ежемесячный платеж:</span>
              <span className="ml-2 text-gray-900">{formatCurrency(client.monthly_payment)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Дата начала:</span>
              <span className="ml-2 text-gray-900">{formatDate(client.start_date)}</span>
            </div>
            {client.client_address && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Адрес:</span>
                <span className="ml-2 text-gray-900">{client.client_address}</span>
              </div>
            )}
            {client.client_phone && (
              <div>
                <span className="font-medium text-gray-700">Телефон клиента:</span>
                <span className="ml-2 text-gray-900">{client.client_phone}</span>
              </div>
            )}
            {client.guarantor_name && (
              <div>
                <span className="font-medium text-gray-700">Гарант:</span>
                <span className="ml-2 text-gray-900">{client.guarantor_name}</span>
              </div>
            )}
            {client.guarantor_phone && (
              <div>
                <span className="font-medium text-gray-700">Телефон гаранта:</span>
                <span className="ml-2 text-gray-900">{client.guarantor_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Schedule */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            График платежей ({client.schedule?.length || 0})
          </h3>
          
          {client.schedule && client.schedule.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Дата платежа
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Сумма
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Статус
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Дней до платежа
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {client.schedule.map((payment, index) => {
                    const daysUntil = getDaysUntilPayment(payment.payment_date);
                    
                    return (
                      <tr key={index} className={getPaymentRowColor(payment)}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {payment.status === 'paid' ? (
                            <span className="text-green-600">Оплачен</span>
                          ) : daysUntil < 0 ? (
                            <span className="text-red-600">Просрочен на {Math.abs(daysUntil)} дн.</span>
                          ) : daysUntil === 0 ? (
                            <span className="text-orange-600">Сегодня</span>
                          ) : (
                            <span className="text-gray-600">{daysUntil} дн.</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {payment.status !== 'paid' && (
                            <div className="flex space-x-1">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleUpdatePaymentStatus(payment.payment_date, 'paid')}
                                disabled={loading}
                              >
                                Оплачен
                              </Button>
                              {payment.status !== 'overdue' && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleUpdatePaymentStatus(payment.payment_date, 'overdue')}
                                  disabled={loading}
                                >
                                  Просрочен
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              График платежей не найден
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ClientDetailsModal;