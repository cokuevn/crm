import React, { useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import Icons from '../components/ui/Icons';

// Arrow Left Icon
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const AddClientForm = ({ capitals, selectedCapital, onClientAdded, onBack }) => {
  const [formData, setFormData] = useState({
    capital_id: selectedCapital?.id || '',
    name: '',
    product: '',
    purchase_amount: '',
    debt_amount: '',
    monthly_payment: '',
    guarantor_name: '',
    client_address: '',
    client_phone: '',
    guarantor_phone: '',
    months: '',
    start_date: new Date().toISOString().split('T')[0],
    contract_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (selectedCapital) {
      setFormData(prev => ({ ...prev, capital_id: selectedCapital.id }));
    }
  }, [selectedCapital]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.post(`/api/clients`, {
        ...formData,
        purchase_amount: parseFloat(formData.purchase_amount),
        debt_amount: parseFloat(formData.debt_amount),
        monthly_payment: parseFloat(formData.monthly_payment),
        months: parseInt(formData.months)
      });

      setSuccess('Клиент успешно добавлен!');
      setFormData({
        capital_id: selectedCapital?.id || '',
        name: '',
        product: '',
        purchase_amount: '',
        debt_amount: '',
        monthly_payment: '',
        guarantor_name: '',
        client_address: '',
        client_phone: '',
        guarantor_phone: '',
        months: '',
        start_date: new Date().toISOString().split('T')[0],
        contract_date: ''
      });
      
      if (onClientAdded) {
        onClientAdded(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Ошибка при добавлении клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fill debt amount if purchase amount changes and debt is empty
    if (name === 'purchase_amount' && !formData.debt_amount) {
      setFormData(prev => ({ ...prev, debt_amount: value }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3">
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад"
          >
            <ArrowLeftIcon />
          </button>
        )}
        <h1 className="text-base font-semibold text-gray-900">Новый клиент</h1>
      </div>
      
      <div className="relative bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 rounded-2xl border border-gray-200/60 overflow-hidden shadow-xl shadow-blue-500/10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/5 before:to-purple-500/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300">
        <div className="p-4 relative z-10">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-50/50 border-l-4 border-red-500 text-red-700 px-3 py-2.5 rounded-lg mb-3 flex items-center gap-2 text-sm shadow-sm">
              <Icons.Warning />
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 border-l-4 border-green-500 text-green-700 px-3 py-2.5 rounded-lg mb-3 flex items-center gap-2 text-sm shadow-sm">
              <Icons.Check />
              <span className="font-medium">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Capital Selection */}
            <div className="relative">
              <select
                name="capital_id"
                value={formData.capital_id}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                required
              >
                <option value="">Выберите капитал</option>
                {capitals.map(capital => (
                  <option key={capital.id} value={capital.id}>
                    {capital.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Information */}
            <div className="space-y-3">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.User className="w-3.5 h-3.5 text-blue-600" />
                    ФИО клиента *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    placeholder="Иванов Иван Иванович"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Device className="w-3.5 h-3.5 text-blue-600" />
                    Товар *
                  </label>
                  <input
                    type="text"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    placeholder="iPhone 15 Pro"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Location className="w-3.5 h-3.5 text-blue-600" />
                    Адрес
                  </label>
                  <input
                    type="text"
                    name="client_address"
                    value={formData.client_address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    placeholder="г. Москва, ул. Ленина, д. 1"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Phone className="w-3.5 h-3.5 text-blue-600" />
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    placeholder="+7 (123) 456-78-90"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Money className="w-3.5 h-3.5 text-green-600" />
                    Сумма покупки (₽) *
                  </label>
                  <input
                    type="number"
                    name="purchase_amount"
                    value={formData.purchase_amount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    required
                    min="0"
                    step="0.01"
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Money className="w-3.5 h-3.5 text-yellow-600" />
                    Долг (₽) *
                  </label>
                  <input
                    type="number"
                    name="debt_amount"
                    value={formData.debt_amount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    required
                    min="0"
                    step="0.01"
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Платёж в месяц (₽) *
                  </label>
                  <input
                    type="number"
                    name="monthly_payment"
                    value={formData.monthly_payment}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    required
                    min="0"
                    step="0.01"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Месяцев *
                  </label>
                  <input
                    type="number"
                    name="months"
                    value={formData.months}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    required
                    min="1"
                    max="60"
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Дата начала *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Calendar className="w-3.5 h-3.5 text-gray-600" />
                    Дата договора
                  </label>
                  <input
                    type="date"
                    name="contract_date"
                    value={formData.contract_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                  />
                </div>
              </div>
            </div>

            {/* Guarantor Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <Icons.User className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Информация о гаранте (необязательно)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.User className="w-3.5 h-3.5 text-purple-600" />
                    ФИО гаранта
                  </label>
                  <input
                    type="text"
                    name="guarantor_name"
                    value={formData.guarantor_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    placeholder="Иванова Мария Петровна"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                    <Icons.Phone className="w-3.5 h-3.5 text-purple-600" />
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="guarantor_phone"
                    value={formData.guarantor_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gradient-to-br from-white to-gray-50/50 border border-gray-300/80 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 focus:shadow-md focus:shadow-blue-500/20 text-sm transition-all shadow-sm hover:shadow-md hover:border-gray-400/80"
                    placeholder="+7 (123) 456-78-91"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200/80">
              <Button type="submit" disabled={loading} size="sm" className="shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
                {loading ? 'Добавление...' : 'Добавить клиента'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AddClientForm;

