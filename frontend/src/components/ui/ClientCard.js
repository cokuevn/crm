import React from 'react';
import Icons from './Icons';
import ProgressBar from './ProgressBar';

function ClientCard({ client, onClick }) {
  const total = client.debt_amount || client.total_amount || 0;
  
  // Use pre-calculated stats if available, otherwise calculate from schedule
  const paid = client.stats 
    ? client.stats.paid_amount 
    : (client.schedule?.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0) || 0);
    
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  
  // Helper function to safely parse payment date
  const parsePaymentDate = (dateStr) => {
    if (!dateStr) return null;
    
    try {
      // Try ISO format first (YYYY-MM-DD)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateStr + 'T00:00:00');
      }
      
      // Try DD.MM.YY or DD.MM.YYYY format
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        let year = parseInt(parts[2], 10);
        
        // Handle 2-digit year
        if (year < 100) {
          year += 2000; // Assume 2000s
        }
        
        return new Date(year, month, day);
      }
      
      // Fallback to standard Date parsing
      return new Date(dateStr);
    } catch (e) {
      return null;
    }
  };

  // Calculate overdue payments if stats not available
  let overdueCount = 0;
  let overdueAmount = 0;

  if (client.stats) {
    overdueCount = client.stats.overdue_count;
    overdueAmount = client.stats.overdue_amount;
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overduePayments = (client.schedule || []).filter(payment => {
      if (payment.status === 'paid') return false;
      
      const paymentDate = parsePaymentDate(payment.payment_date);
      if (!paymentDate || isNaN(paymentDate.getTime())) {
        return false;
      }
      
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate < today;
    });
    
    overdueCount = overduePayments.length;
    overdueAmount = overduePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }

  return (
    <div
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer group"
      onClick={() => onClick?.(client.client_id)}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
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
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {client.name}
            </h3>
            <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
              <Icons.Device />
              <span className="truncate">{client.product}</span>
            </div>
          </div>
        </div>
        <span
          className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium rounded-full flex-shrink-0 ${
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

      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-600">
            <Icons.Money />
            <span>Долг:</span>
          </div>
          <span className="font-semibold text-gray-900">{(client.debt_amount || client.total_amount || 0).toLocaleString()}₽</span>
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center justify-between text-xs sm:text-sm p-2 bg-red-50/80 border border-red-200/50 rounded-lg">
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-red-700">
              <Icons.Warning />
              <span>Просрочено:</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-red-700">{overdueCount} шт.</span>
              <span className="font-bold text-red-800 ml-2">{overdueAmount.toLocaleString()}₽</span>
            </div>
          </div>
        )}
        <div className="hidden sm:flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Icons.Phone />
            <span>Телефон:</span>
          </div>
          <span className="font-medium text-gray-700">{client.client_phone || 'Не указан'}</span>
        </div>
        <div className="hidden sm:flex items-start justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Icons.Location />
            <span>Адрес:</span>
          </div>
          <span className="font-medium text-gray-700 text-right max-w-[60%] break-words">{client.client_address || 'Не указан'}</span>
        </div>
      </div>

      {client.filterReason && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-orange-50/80 border border-orange-200/50 rounded-xl text-xs sm:text-sm text-orange-800 flex items-center space-x-1.5 sm:space-x-2">
          <Icons.Warning />
          <span>{client.filterReason}</span>
        </div>
      )}

      <div className="mb-3 sm:mb-4">
        <ProgressBar value={pct} />
      </div>

      <div className="pt-3 sm:pt-4 border-t border-gray-200/50">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-gray-600">
            <Icons.Calendar />
            <span className="hidden sm:inline">Ежемесячный платёж:</span>
            <span className="sm:hidden">Платёж:</span>
          </div>
          <span className="font-semibold text-blue-600">{client.monthly_payment?.toLocaleString()}₽</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ClientCard);

