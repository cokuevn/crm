import React from 'react';
import Icons from './Icons';

export default function ExpenseCard({ expense, onEdit, onDelete }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Icons.Receipt />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{expense.description}</h3>
            <p className="text-sm text-gray-600">{expense.expense_date}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit?.(expense)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Icons.Edit />
          </button>
          <button
            onClick={() => onDelete?.(expense.expense_id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Icons.Trash />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-600">
          <Icons.Money />
          <span className="text-sm">Сумма:</span>
        </div>
        <span className="font-semibold text-lg text-purple-600">{expense.amount.toLocaleString()}₽</span>
      </div>
    </div>
  );
}

