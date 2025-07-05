import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { validateRequired } from '../../utils/helpers';
import Modal from '../common/Modal';
import Button from '../common/Button';

const AddClientModal = ({ isOpen, onClose, selectedCapital }) => {
  const { createClient } = useApp();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    product: '',
    purchase_amount: '',
    debt_amount: '',
    monthly_payment: '',
    start_date: new Date().toISOString().split('T')[0],
    months: '12',
    guarantor_name: '',
    client_address: '',
    client_phone: '',
    guarantor_phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    try {
      validateRequired(formData.name, 'ФИО клиента');
      validateRequired(formData.product, 'Товар');
      validateRequired(formData.monthly_payment, 'Ежемесячный платеж');
      validateRequired(formData.months, 'Количество месяцев');

      // Validate numeric fields
      if (formData.purchase_amount && isNaN(Number(formData.purchase_amount))) {
        newErrors.purchase_amount = 'Сумма покупки должна быть числом';
      }
      if (formData.debt_amount && isNaN(Number(formData.debt_amount))) {
        newErrors.debt_amount = 'Долг должен быть числом';
      }
      if (isNaN(Number(formData.monthly_payment))) {
        newErrors.monthly_payment = 'Ежемесячный платеж должен быть числом';
      }
      if (isNaN(Number(formData.months)) || Number(formData.months) <= 0) {
        newErrors.months = 'Количество месяцев должно быть положительным числом';
      }
    } catch (error) {
      const field = error.message.includes('ФИО') ? 'name' :
                   error.message.includes('Товар') ? 'product' :
                   error.message.includes('платеж') ? 'monthly_payment' : 'months';
      newErrors[field] = error.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!selectedCapital) {
      alert('Выберите капитал');
      return;
    }

    setLoading(true);
    try {
      const clientData = {
        ...formData,
        capital_id: selectedCapital.id,
        purchase_amount: Number(formData.purchase_amount) || 0,
        debt_amount: Number(formData.debt_amount) || Number(formData.purchase_amount) || 0,
        monthly_payment: Number(formData.monthly_payment),
        months: Number(formData.months)
      };

      await createClient(clientData);
      
      // Reset form
      setFormData({
        name: '',
        product: '',
        purchase_amount: '',
        debt_amount: '',
        monthly_payment: '',
        start_date: new Date().toISOString().split('T')[0],
        months: '12',
        guarantor_name: '',
        client_address: '',
        client_phone: '',
        guarantor_phone: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to create client:', error);
      alert('Ошибка при создании клиента: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Добавить нового клиента</h2>
            <p className="text-gray-600">Заполните информацию о клиенте с подробно расписано</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Capital Selection */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Выбор капитала</span>
            </label>
            <select
              value={selectedCapital?.id || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Выберите капитал</option>
              {selectedCapital && (
                <option value={selectedCapital.id}>{selectedCapital.name}</option>
              )}
            </select>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Основная информация</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>ФИО клиента *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Иванов Иван Иванович"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Товар *</span>
                </label>
                <input
                  type="text"
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  placeholder="iPhone 15 Pro"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.product ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                />
                {errors.product && <p className="text-red-500 text-sm">{errors.product}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Адрес клиента</label>
                <input
                  type="text"
                  name="client_address"
                  value={formData.client_address}
                  onChange={handleInputChange}
                  placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Телефон клиента</label>
                <input
                  type="tel"
                  name="client_phone"
                  value={formData.client_phone}
                  onChange={handleInputChange}
                  placeholder="+7 (775) 456-78-90"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Финансовая информация</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Сумма покупки ₽ *</span>
                </label>
                <input
                  type="number"
                  name="purchase_amount"
                  value={formData.purchase_amount}
                  onChange={handleInputChange}
                  placeholder="120000"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.purchase_amount ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                />
                {errors.purchase_amount && <p className="text-red-500 text-sm">{errors.purchase_amount}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Долг клиента ₽</label>
                <input
                  type="number"
                  name="debt_amount"
                  value={formData.debt_amount}
                  onChange={handleInputChange}
                  placeholder="120000"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.debt_amount ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                />
                {errors.debt_amount && <p className="text-red-500 text-sm">{errors.debt_amount}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Ежемесячный платёж ₽ *</span>
                </label>
                <input
                  type="number"
                  name="monthly_payment"
                  value={formData.monthly_payment}
                  onChange={handleInputChange}
                  placeholder="10000"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.monthly_payment ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                />
                {errors.monthly_payment && <p className="text-red-500 text-sm">{errors.monthly_payment}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Количество месяцев *</span>
                </label>
                <input
                  type="number"
                  name="months"
                  value={formData.months}
                  onChange={handleInputChange}
                  placeholder="12"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.months ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                />
                {errors.months && <p className="text-red-500 text-sm">{errors.months}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Дата начала рассрочки *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Guarantor Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Информация о гаранте</h3>
              <span className="text-sm text-gray-500">(необязательно)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ФИО гаранта</label>
                <input
                  type="text"
                  name="guarantor_name"
                  value={formData.guarantor_name}
                  onChange={handleInputChange}
                  placeholder="Петрова Мария Петровна"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Телефон гаранта</label>
                <input
                  type="tel"
                  name="guarantor_phone"
                  value={formData.guarantor_phone}
                  onChange={handleInputChange}
                  placeholder="+7 (775) 456-78-91"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="px-8"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Клиент</span>
                </div>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddClientModal;
      }
      if (isNaN(Number(formData.monthly_payment))) {
        newErrors.monthly_payment = 'Ежемесячный платеж должен быть числом';
      }
      if (isNaN(Number(formData.months)) || Number(formData.months) < 1) {
        newErrors.months = 'Количество месяцев должно быть положительным числом';
      }

    } catch (error) {
      const field = error.message.includes('ФИО') ? 'name' :
                   error.message.includes('Товар') ? 'product' :
                   error.message.includes('платеж') ? 'monthly_payment' :
                   error.message.includes('месяцев') ? 'months' : 'general';
      
      newErrors[field] = error.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!selectedCapital) {
      setErrors({ general: 'Выберите капитал' });
      return;
    }

    setLoading(true);

    try {
      const clientData = {
        capital_id: selectedCapital.id,
        name: formData.name,
        product: formData.product,
        purchase_amount: Number(formData.purchase_amount) || 0,
        debt_amount: Number(formData.debt_amount) || Number(formData.purchase_amount) || 0,
        monthly_payment: Number(formData.monthly_payment),
        start_date: formData.start_date,
        months: Number(formData.months),
        guarantor_name: formData.guarantor_name,
        client_address: formData.client_address,
        client_phone: formData.client_phone,
        guarantor_phone: formData.guarantor_phone
      };

      await createClient(clientData);
      handleClose();
    } catch (error) {
      console.error('Failed to create client:', error);
      setErrors({ general: 'Ошибка при создании клиента: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      product: '',
      purchase_amount: '',
      debt_amount: '',
      monthly_payment: '',
      start_date: new Date().toISOString().split('T')[0],
      months: '12',
      guarantor_name: '',
      client_address: '',
      client_phone: '',
      guarantor_phone: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Добавить клиента"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="ФИО клиента *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            placeholder="Введите ФИО клиента"
          />

          <Input
            label="Товар *"
            name="product"
            value={formData.product}
            onChange={handleInputChange}
            error={errors.product}
            placeholder="Введите название товара"
          />

          <Input
            label="Сумма покупки"
            type="number"
            name="purchase_amount"
            value={formData.purchase_amount}
            onChange={handleInputChange}
            error={errors.purchase_amount}
            placeholder="0"
          />

          <Input
            label="Долг клиента"
            type="number"
            name="debt_amount"
            value={formData.debt_amount}
            onChange={handleInputChange}
            error={errors.debt_amount}
            placeholder="0"
          />

          <Input
            label="Ежемесячный платеж *"
            type="number"
            name="monthly_payment"
            value={formData.monthly_payment}
            onChange={handleInputChange}
            error={errors.monthly_payment}
            placeholder="0"
          />

          <Input
            label="Количество месяцев *"
            type="number"
            name="months"
            value={formData.months}
            onChange={handleInputChange}
            error={errors.months}
            placeholder="12"
          />

          <Input
            label="Дата начала рассрочки"
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleInputChange}
            error={errors.start_date}
          />

          <Input
            label="ФИО гаранта"
            name="guarantor_name"
            value={formData.guarantor_name}
            onChange={handleInputChange}
            error={errors.guarantor_name}
            placeholder="Введите ФИО гаранта"
          />

          <Input
            label="Адрес клиента"
            name="client_address"
            value={formData.client_address}
            onChange={handleInputChange}
            error={errors.client_address}
            placeholder="Введите адрес"
          />

          <Input
            label="Телефон клиента"
            name="client_phone"
            value={formData.client_phone}
            onChange={handleInputChange}
            error={errors.client_phone}
            placeholder="+7 (999) 123-45-67"
          />

          <Input
            label="Телефон гаранта"
            name="guarantor_phone"
            value={formData.guarantor_phone}
            onChange={handleInputChange}
            error={errors.guarantor_phone}
            placeholder="+7 (999) 123-45-67"
          />
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{errors.general}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            Добавить клиента
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddClientModal;