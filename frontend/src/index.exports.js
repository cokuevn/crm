// Common components
export { default as Button } from './components/common/Button';
export { default as Input } from './components/common/Input';
export { default as Modal } from './components/common/Modal';
export { default as LoadingSpinner } from './components/common/LoadingSpinner';
export { default as PaymentStatusBadge } from './components/common/PaymentStatusBadge';

// Layout components
export { default as Header } from './components/layout/Header';
export { default as Navigation } from './components/layout/Navigation';
export { default as AppContent } from './components/layout/AppContent';

// Auth components
export { default as AuthScreen } from './components/auth/AuthScreen';

// Dashboard components
export { default as Dashboard } from './components/dashboard/Dashboard';

// Client components
export { default as ClientsList } from './components/clients/ClientsList';

// Analytics components
export { default as Analytics } from './components/analytics/Analytics';

// Expenses components
export { default as Expenses } from './components/expenses/Expenses';

// Modal components
export { default as ImportModal } from './components/modals/ImportModal';
export { default as AddClientModal } from './components/modals/AddClientModal';
export { default as ClientDetailsModal } from './components/modals/ClientDetailsModal';
export { default as AddExpenseModal } from './components/modals/AddExpenseModal';

// Contexts
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { AppProvider, useApp } from './contexts/AppContext';

// Services
export { capitalService } from './services/capitalService';
export { clientService } from './services/clientService';
export { expenseService, analyticsService, dashboardService } from './services/dataService';

// Utils
export * from './utils/helpers';
export * from './utils/excelUtils';

// Constants
export * from './constants/api';