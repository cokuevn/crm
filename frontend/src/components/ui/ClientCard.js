import React from 'react';
import Icons from './Icons';
import ProgressBar from './ProgressBar';

function ClientCard({ client, onClick }) {
  const total = client.debt_amount || client.total_amount || 0;
  const paid = client.schedule?.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0) || 0;
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  return (
    <div
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer group"
      onClick={() => onClick?.(client.client_id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              client.status === 'active'
                ? 'bg-green-100 text-green-600'
                : client.status === 'overdue'
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Icons.User />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {client.name}
            </h3>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Icons.Device />
              <span className="truncate">{client.product}</span>
            </div>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
            client.status === 'active'
              ? 'bg-green-100 text-green-800'
              : client.status === 'overdue'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {client.status === 'active' ? 'Активен' : client.status === 'overdue' ? 'Просрочен' : 'Завершён'}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Icons.Money />
            <span>Долг:</span>
          </div>
          <span className="font-semibold text-gray-900">{(client.debt_amount || client.total_amount || 0).toLocaleString()}₽</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Icons.Phone />
            <span>Телефон:</span>
          </div>
          <span className="font-medium text-gray-700">{client.client_phone || 'Не указан'}</span>
        </div>
        <div className="flex items-start justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Icons.Location />
            <span>Адрес:</span>
          </div>
          <span className="font-medium text-gray-700 text-right max-w-[60%] break-words">{client.client_address || 'Не указан'}</span>
        </div>
      </div>

      {client.filterReason && (
        <div className="mb-4 p-3 bg-orange-50/80 border border-orange-200/50 rounded-xl text-sm text-orange-800 flex items-center space-x-2">
          <Icons.Warning />
          <span>{client.filterReason}</span>
        </div>
      )}

      <div className="mb-4">
        <ProgressBar value={pct} />
      </div>

      <div className="pt-4 border-t border-gray-200/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Icons.Calendar />
            <span>Ежемесячный платёж:</span>
          </div>
          <span className="font-semibold text-blue-600">{client.monthly_payment?.toLocaleString()}₽</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ClientCard);

