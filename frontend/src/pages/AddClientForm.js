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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <h1 className="text-lg font-semibold text-gray-900">Добавить клиента</h1>
            <p className="text-sm text-gray-600">{selectedCapital?.name || 'Новый клиент'}</p>
          </div>
        </div>
      )}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Icons.User />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Добавить нового клиента</h2>
              <p className="text-gray-600 mt-1">Заполните информацию о клиенте и условиях рассрочки</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
              <Icons.Warning />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
              <Icons.Check />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Capital Selection */}
            <div className="bg-gray-50/50 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Icons.Money />
                <h3 className="text-lg font-semibold text-gray-900">Выбор капитала</h3>
              </div>
              <select
                name="capital_id"
                value={formData.capital_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
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
            <div className="bg-blue-50/30 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Icons.User />
                <h3 className="text-lg font-semibold text-gray-900">Основная информация</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.User />
                    <span>ФИО клиента *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="Иванов Иван Иванович"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Device />
                    <span>Товар *</span>
                  </label>
                  <input
                    type="text"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="iPhone 15 Pro"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Location />
                    <span>Адрес клиента</span>
                  </label>
                  <input
                    type="text"
                    name="client_address"
                    value={formData.client_address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Phone />
                    <span>Телефон клиента</span>
                  </label>
                  <input
                    type="tel"
                    name="client_phone"
                    value={formData.client_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="+7 (123) 456-78-90"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-green-50/30 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Icons.Money />
                <h3 className="text-lg font-semibold text-gray-900">Финансовая информация</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Money />
                    <span>Сумма покупки (₽) *</span>
                  </label>
                  <input
                    type="number"
                    name="purchase_amount"
                    value={formData.purchase_amount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                    min="0"
                    step="0.01"
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Money />
                    <span>Долг клиента (₽) *</span>
                  </label>
                  <input
                    type="number"
                    name="debt_amount"
                    value={formData.debt_amount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                    min="0"
                    step="0.01"
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Calendar />
                    <span>Ежемесячный платёж (₽) *</span>
                  </label>
                  <input
                    type="number"
                    name="monthly_payment"
                    value={formData.monthly_payment}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                    min="0"
                    step="0.01"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Clock />
                    <span>Количество месяцев *</span>
                  </label>
                  <input
                    type="number"
                    name="months"
                    value={formData.months}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                    min="1"
                    max="60"
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Calendar />
                    <span>Дата начала рассрочки *</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Calendar />
                    <span>Дата заключения договора</span>
                  </label>
                  <input
                    type="date"
                    name="contract_date"
                    value={formData.contract_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="Оставьте пустым для автозаполнения"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Если не указано, будет установлено как дата начала рассрочки минус 1 месяц
                  </p>
                </div>
              </div>
            </div>

            {/* Guarantor Information */}
            <div className="bg-purple-50/30 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Icons.User />
                <h3 className="text-lg font-semibold text-gray-900">Информация о гаранте</h3>
                <span className="text-sm text-gray-500">(необязательно)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.User />
                    <span>ФИО гаранта</span>
                  </label>
                  <input
                    type="text"
                    name="guarantor_name"
                    value={formData.guarantor_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="Иванова Мария Петровна"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <Icons.Phone />
                    <span>Телефон гаранта</span>
                  </label>
                  <input
                    type="tel"
                    name="guarantor_phone"
                    value={formData.guarantor_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="+7 (123) 456-78-91"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200/50">
              <Button type="submit" disabled={loading} leadingIcon={<Icons.User />}> {loading ? 'Добавление...' : 'Клиент'} </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AddClientForm;

