// API Configuration
export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    AUTO_INIT: '/api/auto-init',
  },
  CAPITALS: {
    BASE: '/api/capitals',
    BY_ID: (id) => `/api/capitals/${id}`,
  },
  CLIENTS: {
    BASE: '/api/clients',
    BY_ID: (id) => `/api/clients/${id}`,
    PAYMENTS: (clientId, paymentDate) => `/api/clients/${clientId}/payments/${paymentDate}`,
  },
  EXPENSES: {
    BASE: '/api/expenses',
    BY_ID: (id) => `/api/expenses/${id}`,
  },
  ANALYTICS: {
    BY_CAPITAL: (id) => `/api/analytics/${id}`,
  },
  DASHBOARD: {
    BASE: '/api/dashboard',
  }
};

// Payment Statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

// Navigation Pages
export const PAGES = {
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  EXPENSES: 'expenses'
};

// Excel Import Configuration
export const EXCEL_CONFIG = {
  MAX_PAYMENTS: 24,
  PAYMENT_COLUMNS_START: 7,
  ADDITIONAL_INFO_START: 55,
  STATUS_MAPPING: {
    'оплачен': PAYMENT_STATUS.PAID,
    'paid': PAYMENT_STATUS.PAID,
    'выплачен': PAYMENT_STATUS.PAID,
    'просрочен': PAYMENT_STATUS.OVERDUE,
    'overdue': PAYMENT_STATUS.OVERDUE,
    'просрочено': PAYMENT_STATUS.OVERDUE,
    'будущий': PAYMENT_STATUS.PENDING,
    'pending': PAYMENT_STATUS.PENDING,
    'ожидается': PAYMENT_STATUS.PENDING
  }
};