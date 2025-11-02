import React from 'react';
import Icons from './Icons';

export default function ExpenseCard({ expense, onEdit, onDelete }) {
  return (
    <div className="group bg-gradient-to-br from-white to-gray-50/50 rounded-xl border border-gray-200/80 p-3 hover:shadow-lg hover:border-purple-200/60 transition-all duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                {expense.description}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{expense.expense_date}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between pl-3">
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              {expense.amount.toLocaleString()}₽
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit?.(expense)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
              >
                <Icons.Edit />
              </button>
              <button
                onClick={() => onDelete?.(expense.expense_id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

