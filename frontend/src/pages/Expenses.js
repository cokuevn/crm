import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../lib/api';
import { listExpenses, deleteExpense } from '../lib/services/expensesService';
import { Skeleton, SkeletonCircle } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import ExpenseModal from '../components/modals/ExpenseModal';
import ExpenseCard from '../components/ui/ExpenseCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Icons from '../components/ui/Icons';

// Arrow Left Icon
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Placeholder: actual implementation can be ported here
const Expenses = ({ selectedCapital, onBack }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (selectedCapital) {
      fetchExpenses();
    }
  }, [selectedCapital]);

  const fetchExpenses = async () => {
    if (!selectedCapital) return;
    
    setLoading(true);
    try {
      const data = await listExpenses(selectedCapital.id);
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseAdded = useCallback((newExpense) => {
    setExpenses(prev => [newExpense, ...prev]);
    setShowAddModal(false);
  }, []);

  const handleExpenseUpdated = useCallback((updatedExpense) => {
    setExpenses(prev => prev.map(exp => 
      exp.expense_id === updatedExpense.expense_id ? updatedExpense : exp
    ));
    setEditingExpense(null);
  }, []);

  const handleDeleteExpense = useCallback(async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      setExpenses(prev => prev.filter(exp => exp.expense_id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Ошибка', message: 'Не удалось удалить расход' } }));
    }
  }, []);

  if (!selectedCapital) {
    return (
      <div className="space-y-4 sm:space-y-6">
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
              <h1 className="text-lg font-semibold text-gray-900">Расходы</h1>
              <p className="text-sm text-gray-600">Управление расходами</p>
            </div>
          </div>
        )}
        
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icons.Receipt />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Выберите капитал</h3>
        <p className="text-gray-600">Выберите капитал для просмотра расходов</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
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
              <h1 className="text-lg font-semibold text-gray-900">Расходы</h1>
              <p className="text-sm text-gray-600">{selectedCapital?.name || 'Загрузка...'}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonCircle size={40} />
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <SkeletonCircle size={40} />
                  <div>
                    <Skeleton className="h-5 w-44 mb-2" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 ml-auto" />
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Назад"
            >
              <ArrowLeftIcon />
            </button>
          )}
          <h1 className="text-base font-semibold text-gray-900">Расходы</h1>
          <span className="text-xs text-gray-500">({selectedCapital?.name})</span>
        </div>
        <Button onClick={() => setShowAddModal(true)} variant="primary" size="sm" className="shadow-sm" leadingIcon={<Icons.Plus />}>Добавить</Button>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Icons.Receipt />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Нет расходов</h3>
          <p className="text-sm text-gray-600 mb-3">Добавьте первый расход</p>
          <Button onClick={() => setShowAddModal(true)} size="sm">Добавить</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {expenses.map(expense => (
            <ExpenseCard
              key={expense.expense_id}
              expense={expense}
              onEdit={setEditingExpense}
              onDelete={(id) => setDeleteCandidate(id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      <ExpenseModal
        isOpen={showAddModal || !!editingExpense}
        onClose={() => {
          setShowAddModal(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
        capital={selectedCapital}
        onExpenseAdded={handleExpenseAdded}
        onExpenseUpdated={handleExpenseUpdated}
      />

      <ConfirmDialog
        isOpen={!!deleteCandidate}
        title="Удалить расход?"
        description="Действие необратимо."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          handleDeleteExpense(deleteCandidate);
          setDeleteCandidate(null);
        }}
      />
    </div>
  );
};

export default Expenses;

