/**
 * Format currency amount
 */
export const formatCurrency = (amount, currency = '₽') => {
  if (amount == null) return `0 ${currency}`;
  return new Intl.NumberFormat('ru-RU').format(amount) + ` ${currency}`;
};

/**
 * Format date to Russian locale
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch {
    return dateString;
  }
};

/**
 * Get payment status color
 */
export const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-100';
    case 'overdue':
      return 'text-red-600 bg-red-100';
    case 'pending':
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Get payment status text
 */
export const getPaymentStatusText = (status) => {
  switch (status) {
    case 'paid':
      return 'Оплачен';
    case 'overdue':
      return 'Просрочено';
    case 'pending':
    default:
      return 'Ожидается';
  }
};

/**
 * Calculate days until payment
 */
export const getDaysUntilPayment = (paymentDate) => {
  const today = new Date();
  const payment = new Date(paymentDate);
  const diffTime = payment - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Generate payment schedule
 */
export const generatePaymentSchedule = (startDate, monthlyAmount, months) => {
  const schedule = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < months; i++) {
    const paymentDate = new Date(start);
    paymentDate.setMonth(paymentDate.getMonth() + i);
    
    schedule.push({
      payment_date: paymentDate.toISOString().split('T')[0],
      amount: monthlyAmount,
      status: 'pending',
      paid_date: null
    });
  }
  
  return schedule;
};

/**
 * Validate form fields
 */
export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    throw new Error(`Поле "${fieldName}" обязательно для заполнения`);
  }
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Russian format)
 */
export const validatePhone = (phone) => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\+]?[7-8]?[0-9\-\(\)\s]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};