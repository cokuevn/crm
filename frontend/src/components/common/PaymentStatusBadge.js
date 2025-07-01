import React from 'react';
import { getPaymentStatusColor, getPaymentStatusText } from '../../utils/helpers';

const PaymentStatusBadge = ({ status, className = '' }) => {
  const colorClasses = getPaymentStatusColor(status);
  const statusText = getPaymentStatusText(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}>
      {statusText}
    </span>
  );
};

export default PaymentStatusBadge;