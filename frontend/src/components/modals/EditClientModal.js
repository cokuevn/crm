import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { API, getAuthHeaders } from '../../lib/api';

const EditClientModal = ({ isOpen, onClose, client, onClientUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    product: '',
    purchase_amount: '',
    debt_amount: '',
    monthly_payment: '',
    guarantor_name: '',
    client_address: '',
    client_phone: '',
    guarantor_phone: '',
    contract_date: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        name: client.name || '',
        product: client.product || '',
        purchase_amount: client.purchase_amount || client.total_amount || '',
        debt_amount: client.debt_amount || client.total_amount || '',
        monthly_payment: client.monthly_payment || '',
        guarantor_name: client.guarantor_name || '',
        client_address: client.client_address || '',
        client_phone: client.client_phone || '',
        guarantor_phone: client.guarantor_phone || '',
        contract_date: client.contract_date || '',
        start_date: client.start_date || '',
        end_date: client.end_date || '',
      });
    }
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Check if dates have changed to trigger schedule recalculation
      const datesChanged = client.start_date !== formData.start_date || client.end_date !== formData.end_date;
      
      const response = await apiClient.put(
        `/api/clients/${client.client_id}`,
        {
          ...formData,
          purchase_amount: parseFloat(formData.purchase_amount),
          debt_amount: parseFloat(formData.debt_amount),
          monthly_payment: parseFloat(formData.monthly_payment),
          recalculate_schedule: datesChanged, // Flag to recalculate payment schedule
        },
        {}
      );
      onClientUpdated?.(response.data);
      onClose();
      
      // Show success notification if schedule was recalculated
      if (datesChanged) {
        window.dispatchEvent(new CustomEvent('app:notify', { 
          detail: { 
            type: 'success', 
            title: 'Успешно обновлено', 
            message: 'График платежей пересчитан с учетом новых дат' 
          } 
        }));
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      
      // Auto-calculate end_date when start_date or monthly_payment changes
      if ((name === 'start_date' || name === 'monthly_payment' || name === 'debt_amount') && 
          newFormData.start_date && newFormData.monthly_payment && newFormData.debt_amount) {
        try {
          const debtAmount = parseFloat(newFormData.debt_amount);
          const monthlyPayment = parseFloat(newFormData.monthly_payment);
          
          if (debtAmount > 0 && monthlyPayment > 0) {
            const months = Math.ceil(debtAmount / monthlyPayment);
            const startDate = new Date(newFormData.start_date);
            const endDate = new Date(startDate);
            
            // Add months to start date
            endDate.setMonth(endDate.getMonth() + months - 1); // -1 because we start from the same month
            newFormData.end_date = endDate.toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Error calculating end date:', error);
        }
      }
      
      return newFormData;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">✏️ Редактировать клиента</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">📋 Основная информация</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ФИО клиента *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Товар *</label>
                <input type="text" name="product" value={formData.product} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Адрес клиента</label>
                <input type="text" name="client_address" value={formData.client_address} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Телефон клиента</label>
                <input type="tel" name="client_phone" value={formData.client_phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">💰 Финансовая информация</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Сумма покупки (₽) *</label>
                <input type="number" name="purchase_amount" value={formData.purchase_amount} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Долг клиента (₽) *</label>
                <input type="number" name="debt_amount" value={formData.debt_amount} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ежемесячный платёж (₽) *</label>
                <input type="number" name="monthly_payment" value={formData.monthly_payment} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата заключения договора</label>
                <input type="date" name="contract_date" value={formData.contract_date} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">📅 Даты рассрочки</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата начала рассрочки *</label>
                <input 
                  type="date" 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата окончания рассрочки</label>
                <input 
                  type="date" 
                  name="end_date" 
                  value={formData.end_date} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" 
                  title="Дата рассчитывается автоматически или может быть изменена вручную"
                />
                <p className="text-xs text-gray-500 mt-1">💡 Рассчитывается автоматически по долгу и платежу</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">🤝 Информация о гаранте</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ФИО гаранта</label>
                <input type="text" name="guarantor_name" value={formData.guarantor_name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Телефон гаранта</label>
                <input type="tel" name="guarantor_phone" value={formData.guarantor_phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Отмена</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{loading ? 'Сохранение...' : '💾 Сохранить'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClientModal;