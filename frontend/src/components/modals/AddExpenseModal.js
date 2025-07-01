import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const AddExpenseModal = ({ isOpen, onClose, selectedCapital }) => {
  const { createExpense } = useApp();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Общие расходы'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }
    if (!formData.amount || isNaN(Number(formData.amount))) {
      newErrors.amount = 'Введите корректную сумму';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await createExpense({
        capital_id: selectedCapital.id,
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category
      });
      handleClose();
    } catch (error) {
      setErrors({ general: 'Ошибка при создании расхода' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'Общие расходы'
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Добавить расход"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Описание расхода *"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          error={errors.description}
          placeholder="Введите описание расхода"
        />

        <Input
          label="Сумма *"
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          error={errors.amount}
          placeholder="0"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категория
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Общие расходы">Общие расходы</option>
            <option value="Маркетинг">Маркетинг</option>
            <option value="Операционные расходы">Операционные расходы</option>
            <option value="Прочие">Прочие</option>
          </select>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{errors.general}</div>
          </div>
        )}

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
          >
            Добавить
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddExpenseModal;