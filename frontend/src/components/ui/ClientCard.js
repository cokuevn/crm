import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import Icons from './Icons';
import ProgressBar from './ProgressBar';

function ClientCard({ client, onClick, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const total = client.debt_amount || client.total_amount || 0;
  const paid = client.schedule?.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0) || 0;
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  
  const handlers = useSwipeable({
    onSwipedRight: () => {
      // Свайп вправо - звонок
      if (client.client_phone) {
        window.open(`tel:${client.client_phone}`);
      }
    },
    onSwipedLeft: () => {
      // Свайп влево - показать действия
      setShowActions(true);
      setTimeout(() => setShowActions(false), 3000);
    },
    trackMouse: false,
    trackTouch: true,
  });

  const handleCardClick = (e) => {
    // Предотвращаем клик если показаны действия
    if (!showActions) {
      onClick?.(client.client_id);
    }
  };

  return (
    <div {...handlers} className="relative">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-300 cursor-pointer group touch-safe ${
          showActions ? 'translate-x-[-120px]' : 'translate-x-0'
        } transition-transform duration-300`}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start mb-3">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
              client.status === 'active'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : client.status === 'overdue'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Icons.User />
          </div>
          
          {/* Name + Badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {client.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                  client.status === 'active'
                    ? 'bg-success-200 dark:bg-success-900/30 text-success-800 dark:text-success-300'
                    : client.status === 'overdue'
                    ? 'bg-error-200 dark:bg-error-900/30 text-error-800 dark:text-error-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}
              >
                {client.status === 'active' ? 'Активен' : client.status === 'overdue' ? 'Просрочен' : 'Завершён'}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 truncate">
              <Icons.Device />
              <span className="ml-1 truncate">{client.product}</span>
            </div>
          </div>
        </div>

        {/* Debt Chip */}
        {total > 0 && (
          <div className="flex items-center mt-2 mb-3 text-error-600 dark:text-error-400 font-semibold text-sm">
            <Icons.Warning />
            <span>Долг: {total.toLocaleString('ru-RU')}₽</span>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              Оплачено: {paid.toLocaleString('ru-RU')}₽
            </span>
          </div>
        )}

        {/* Compact Info */}
        <div className="space-y-2 mb-3">
          {client.client_phone && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <Icons.Phone />
              <span className="ml-2 truncate">{client.client_phone}</span>
            </div>
          )}
          {client.client_address && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <Icons.Location />
              <span className="ml-2 truncate">{client.client_address}</span>
            </div>
          )}
        </div>

        {/* Warning Reason */}
        {client.filterReason && (
          <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg text-xs text-orange-800 dark:text-orange-300 flex items-center">
            <Icons.Warning />
            <span className="ml-2">{client.filterReason}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-3">
          <ProgressBar value={pct} className="w-full h-2" />
        </div>

        {/* Monthly Payment */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Icons.Calendar />
            <span className="ml-2">Платёж:</span>
          </div>
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {client.monthly_payment?.toLocaleString('ru-RU')}₽
          </span>
        </div>
      </div>

      {/* Swipe Actions (справа от карточки) */}
      {showActions && (
        <div className="absolute right-0 top-0 bottom-0 w-[120px] flex items-center justify-end gap-2 pr-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(client);
              setShowActions(false);
            }}
            className="bg-primary-600 text-white rounded-xl p-3 touch-safe shadow-lg"
            title="Редактировать"
          >
            <Icons.Edit />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(client);
              setShowActions(false);
            }}
            className="bg-error-600 text-white rounded-xl p-3 touch-safe shadow-lg"
            title="Удалить"
          >
            <Icons.Trash />
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(ClientCard);

