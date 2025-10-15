import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../lib/api';
import { createExpense, updateExpense } from '../../lib/services/expensesService';
import Button from '../ui/Button';

const ExpenseModal = ({ isOpen, onClose, expense, capital, onExpenseAdded, onExpenseUpdated }) => {
  const [formData, setFormData] = useState({ amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (expense && isOpen) {
      setFormData({ amount: expense.amount?.toString() || '', description: expense.description || '', expense_date: expense.expense_date || new Date().toISOString().split('T')[0] });
      setError('');
    } else if (!expense && isOpen) {
      setFormData({ amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
      setError('');
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { ...formData, amount: parseFloat(formData.amount) };
      if (expense) {
        const updated = await updateExpense(expense.expense_id, data);
        onExpenseUpdated?.(updated);
      } else {
        data.capital_id = capital.id;
        const created = await createExpense(data);
        onExpenseAdded?.(created);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении расхода');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <span>{expense ? 'Редактировать расход' : 'Добавить расход'}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {error && <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Назначение расхода *</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200" placeholder="Аренда офиса, реклама, расходные материалы..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Сумма расхода (₽) *</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200" placeholder="5000" required min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Дата расхода *</label>
            <input type="date" name="expense_date" value={formData.expense_date} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200" required />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : expense ? 'Обновить' : 'Добавить'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;

