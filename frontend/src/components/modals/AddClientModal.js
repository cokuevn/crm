import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { validateRequired } from '../../utils/helpers';
import Modal from '../common/Modal';
import Input from '../common/Input';
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