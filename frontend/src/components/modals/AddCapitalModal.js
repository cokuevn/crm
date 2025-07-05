import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import Modal from '../common/Modal';

const AddCapitalModal = ({ isOpen, onClose }) => {
  const { createCapital } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    balance: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addCapital(formData);
      setFormData({ name: '', description: '', balance: 0 });
      onClose();
    } catch (error) {
      console.error('Failed to add capital:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'balance' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать капитал">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Название капитала *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите название капитала"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Описание капитала (необязательно)"
          />
        </div>

        <div>
          <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
            Начальный баланс
          </label>
          <input
            type="number"
            id="balance"
            name="balance"
            value={formData.balance}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Создать капитал
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCapitalModal;